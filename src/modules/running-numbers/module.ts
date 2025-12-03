import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RunningNumberRepository } from './repository';
import { RunningNumber } from 'src/models/running-number.model';

@Module({
  imports: [SequelizeModule.forFeature([RunningNumber])],
  controllers: [],
  providers: [RunningNumberRepository],
  exports: [RunningNumberRepository],
})
export class RunningNumberModule {}
