import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlanRepository } from './repository';
import { PlanService } from './service';
import { PlanController } from './controller';
import { Plan } from 'src/models/plan.model';

@Module({
  imports: [SequelizeModule.forFeature([Plan])],
  controllers: [PlanController],
  providers: [PlanRepository, PlanService],
  exports: [PlanRepository, PlanService],
})
export class PlanModule {}
