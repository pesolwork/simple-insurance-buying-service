import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { ClaimRepository } from './repository';
import { CreateOptions, FindOptions, Op } from 'sequelize';
import { ClaimDTO } from './dto/dto';
import { ClaimSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Claim } from 'src/models/claim.model';
import { RunningNumberType } from 'src/common/enum';
import { RunningNumberRepository } from '../running-numbers/repository';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ClaimService extends BaseService<Claim, ClaimDTO> {
  constructor(
    private readonly _repository: ClaimRepository,
    private readonly _runningNumberRepository: RunningNumberRepository,
    private readonly _sequelize: Sequelize,
  ) {
    super(_repository);
  }

  private async getRunningNumber() {
    const year = new Date().getFullYear();
    let result = await this._runningNumberRepository.findOne({
      where: {
        type: RunningNumberType.Claim,
        prefix: `CLAIM-${year}`,
      },
    });
    if (!result) {
      result = await this._runningNumberRepository.create({
        type: RunningNumberType.Claim,
        prefix: `CLAIM-${year}`,
        currentNumber: 0,
      });
    }
    return result;
  }

  async create(
    data: any,
    options?: CreateOptions<Claim>,
  ): Promise<ResponseDTO<ClaimDTO>> {
    const runningNumberModel = await this.getRunningNumber();
    const runningNumber = runningNumberModel.currentNumber + 1;

    const trx = await this._sequelize.transaction();
    try {
      await this._runningNumberRepository.update(
        { currentNumber: runningNumber },
        {
          where: {
            id: runningNumberModel.id,
          },
          transaction: trx,
        },
      );

      data.claimNumber = `${runningNumberModel.prefix}-${runningNumber.toString().padStart(4, '0')}`;
      const result = super.create(data, options);

      await trx.commit();

      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async findAll(
    query?: ClaimSearchDTO,
    options?: FindOptions<Claim>,
  ): Promise<ResponseDTO<ClaimDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = ['claimNumber'];
      options.where = {
        ...options.where,
        [Op.or]: fields.map((field) => ({
          [field]: {
            [Op.iLike]: search,
          },
        })),
      };
    }

    const fields = ['policyId', 'customerId', 'createdById', 'status'];
    for (const value of fields) {
      if (query[value]) {
        options.where[value] = query[value];
      }
    }

    return super.findAll(query, options);
  }
}
