import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Transaction } from 'src/models/transaction.model';

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  constructor(
    @InjectModel(Transaction)
    private _model: typeof Transaction,
  ) {
    super(_model);
  }
}
