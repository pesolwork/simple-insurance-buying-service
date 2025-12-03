import { BadRequestException, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { PolicyService } from '../policies/service';
import { PolicyRepository } from '../policies/repository';
import { CustomerRepository } from '../customers/repository';
import { BeneficiaryRepository } from '../beneficiaries/repository';
import { HealthInfoRepository } from '../health-infos/repository';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { PaymentService } from 'artifacts/payment/service';
import {
  PolicyStatus,
  RunningNumberType,
  TransactionStatus,
} from 'src/common/enum';
import { TransactionRepository } from '../transactions/repository';
import { RunningNumberRepository } from '../running-numbers/repository';
import { EmailProducer } from '../email-queue/producer';

@Injectable()
export class PaymentsService extends PolicyService {
  constructor(
    private readonly _repo: PolicyRepository,
    private readonly _customerRepository: CustomerRepository,
    private readonly _beneficiaryRepository: BeneficiaryRepository,
    private readonly _healthInfoRepository: HealthInfoRepository,
    private readonly _transactionRepository: TransactionRepository,
    private readonly _runningNumberRepository: RunningNumberRepository,
    private readonly _paymentService: PaymentService,
    private readonly _sequelize: Sequelize,
    private readonly _emailProducer: EmailProducer,
  ) {
    super(_repo);
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

  private async verifyWebhookCharge(eventId: string, bodyData: any) {
    const event = await this._paymentService.retrieveEvent(eventId);
    const charge = event?.data;

    if (!charge || charge.object !== 'charge' || charge.id !== bodyData.id) {
      throw new BadRequestException('Invalid webhook');
    }

    return charge;
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
      const policy = await this._repo.findById(policyId, {
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
        this._repo.update(policyUpdates, {
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

  async paymentWebhook(body: any) {
    const { id: eventId, data } = body;

    // Step 1: Verify Webhook Event
    const charge = await this.verifyWebhookCharge(eventId, data);
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

    return new ResponseDTO({ message: 'Webhook processed' });
  }

  private buildPolicyUpdate(isPaid: boolean, paidAt: Date | null, no: string) {
    if (!isPaid) {
      return {}; // ไม่แก้ policy หาก payment fail
    }

    const startDate = paidAt;
    const endDate = startDate
      ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    return {
      no,
      status: PolicyStatus.Active,
      startDate,
      endDate,
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
}
