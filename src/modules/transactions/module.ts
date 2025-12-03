import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransactionRepository } from './repository';
import { TransactionService } from './service';
import { TransactionController } from './controller';
import { Transaction } from 'src/models/transaction.model';

@Module({
  imports: [SequelizeModule.forFeature([Transaction])],
  controllers: [TransactionController],
  providers: [TransactionRepository, TransactionService],
  exports: [TransactionRepository, TransactionService],
})
export class TransactionModule {}
