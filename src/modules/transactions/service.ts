import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { TransactionRepository } from './repository';
import { FindOptions } from 'sequelize';
import { TransactionDTO } from './dto/dto';
import { TransactionSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Transaction } from 'src/models/transaction.model';

@Injectable()
export class TransactionService extends BaseService<
  Transaction,
  TransactionDTO
> {
  constructor(private readonly _repository: TransactionRepository) {
    super(_repository);
  }

  async findAll(
    query?: TransactionSearchDTO,
    options?: FindOptions<Transaction>,
  ): Promise<ResponseDTO<TransactionDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    const fields = ['policyId', 'status'];

    for (const value of fields) {
      if (query[value]) {
        options.where[value] = query[value];
      }
    }

    return super.findAll(query, options);
  }
}
