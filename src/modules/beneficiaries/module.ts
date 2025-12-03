import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BeneficiaryRepository } from './repository';
import { BeneficiaryService } from './service';
import { BeneficiaryController } from './controller';
import { Beneficiary } from 'src/models/beneficiary.model';

@Module({
  imports: [SequelizeModule.forFeature([Beneficiary])],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryRepository, BeneficiaryService],
  exports: [BeneficiaryRepository, BeneficiaryService],
})
export class BeneficiaryModule {}
