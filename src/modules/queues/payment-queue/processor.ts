import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PolicyRepository } from '../../policies/repository';
import { PaymentQueueJobName } from './constants';
import { BadRequestException, Logger } from '@nestjs/common';
import {
  PolicyStatus,
  RunningNumberType,
  TransactionStatus,
} from 'src/common/enum';
import { TransactionRepository } from 'src/modules/transactions/repository';
import { RunningNumberRepository } from 'src/modules/running-numbers/repository';
import { Sequelize } from 'sequelize-typescript';
import { EmailProducer } from '../email-queue/producer';
import * as dayjs from 'dayjs';

@Processor('payment_queue')
export class PaymentProcessor extends WorkerHost {
  private readonly _logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly _policyRepository: PolicyRepository,
    private readonly _transactionRepository: TransactionRepository,
    private readonly _runningNumberRepository: RunningNumberRepository,
    private readonly _sequelize: Sequelize,
    private readonly _emailProducer: EmailProducer,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case PaymentQueueJobName.ProcessWebhook:
        return this.processWebhook(job);
      default:
        throw new Error(`Unknown email job: ${job.name}`);
    }
  }

  private async processWebhook(job: Job<any>) {
    const charge = job.data;

    const { policyId, paymentMethod, paidAmount, isPaid, paidAt } =
      this.extractChargeInfo(charge);

    // Step 2: Load Transaction
    const transaction = await this.loadTransaction(charge.id, paymentMethod);
    if (paidAmount !== +transaction.expectedAmount) {
      throw new BadRequestException('Invalid amount');
    }

    // Step 3: Update Policy + Transaction inside Transaction Lock
    await this.updatePaymentPolicy(policyId, charge.id, {
      isPaid,
      paidAt,
      paidAmount,
    });

    // Step 4: Send Email After Commit
    if (isPaid) {
      this._emailProducer.sendPolicyEmail(policyId);
    }

    return true;
  }

  private async getRunningNumber() {
    const year = new Date().getFullYear();
    let result = await this._runningNumberRepository.findOne({
      where: {
        type: RunningNumberType.Policy,
        prefix: `POL-${year}`,
      },
    });
    if (!result) {
      result = await this._runningNumberRepository.create({
        type: RunningNumberType.Policy,
        prefix: `POL-${year}`,
        currentNumber: 0,
      });
    }
    return result;
  }

  private extractChargeInfo(charge: any) {
    const policyId = charge.metadata?.policyId;
    const paymentMethod = charge.metadata?.paymentMethod;

    if (!policyId || !paymentMethod) {
      throw new BadRequestException('Missing charge metadata');
    }

    const paidAmount = charge.amount / 100;

    return {
      policyId,
      paymentMethod,
      paidAmount,
      isPaid: charge.status === 'successful',
      paidAt: charge.paid_at ? new Date(charge.paid_at) : null,
    };
  }

  private async loadTransaction(transactionRef: string, paymentMethod: string) {
    const trx = await this._transactionRepository.findOne({
      where: { transactionRef, paymentMethod },
    });

    if (!trx) {
      throw new BadRequestException('Transaction not found');
    }

    return trx;
  }

  private async updatePaymentPolicy(
    policyId: number,
    transactionRef: string,
    info: { isPaid: boolean; paidAt: Date | null; paidAmount: number },
  ) {
    const trx = await this._sequelize.transaction();

    try {
      const policy = await this._policyRepository.findById(policyId, {
        transaction: trx,
        lock: trx.LOCK.UPDATE,
      });

      if (!policy) throw new BadRequestException('Policy not found');

      // Already processed (idempotent)
      if (policy.status === PolicyStatus.Active) {
        await trx.commit();
        return;
      }

      const runningNumber = await this.getRunningNumber();
      const finalRunningNumber = runningNumber.currentNumber + 1;

      const policyUpdates = this.buildPolicyUpdate(
        info.isPaid,
        info.paidAt,
        `${runningNumber.prefix}-${finalRunningNumber.toString().padStart(4, '0')}`,
      );

      const transactionUpdates = this.buildTransactionUpdate(
        info.isPaid,
        info.paidAt,
        info.paidAmount,
      );

      await Promise.all([
        this._policyRepository.update(policyUpdates, {
          where: { id: policyId },
          transaction: trx,
        }),
        this._transactionRepository.update(transactionUpdates, {
          where: { transactionRef },
          transaction: trx,
        }),
        info.isPaid &&
          this._runningNumberRepository.update(
            { currentNumber: finalRunningNumber },
            { where: { id: runningNumber.id }, transaction: trx },
          ),
      ]);

      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  private buildPolicyUpdate(isPaid: boolean, paidAt: Date | null, no: string) {
    if (!isPaid) {
      return {}; // ไม่แก้ policy หาก payment fail
    }

    const start = paidAt ? dayjs(paidAt) : null;
    const end = start ? start.add(365, 'day') : null;

    return {
      no,
      status: PolicyStatus.Active,
      startDate: start ? start.toDate() : null,
      endDate: end ? end.toDate() : null,
    };
  }

  private buildTransactionUpdate(
    isPaid: boolean,
    paidAt: Date | null,
    paidAmount: number,
  ) {
    return {
      status: isPaid ? TransactionStatus.Paid : TransactionStatus.Failed,
      paidAt,
      paidAmount: isPaid ? paidAmount.toString() : null,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this._logger.log(`Payment job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this._logger.log(`Payment job ${job.id} failed: ${err.message}`);
  }
}
