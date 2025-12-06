import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClaimRepository } from './repository';
import { ClaimService } from './service';
import { ClaimController } from './controller';
import { Claim } from 'src/models/claim.model';
import { RunningNumberModule } from '../running-numbers/module';
import { ClaimBll } from './bll';

@Module({
  imports: [SequelizeModule.forFeature([Claim]), RunningNumberModule],
  controllers: [ClaimController],
  providers: [ClaimRepository, ClaimService, ClaimBll],
  exports: [ClaimRepository, ClaimService, ClaimBll],
})
export class ClaimModule {}
