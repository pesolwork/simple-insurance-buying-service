import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthInfoRepository } from './repository';
import { HealthInfoService } from './service';
import { HealthInfoController } from './controller';
import { HealthInfo } from 'src/models/health-info.model';

@Module({
  imports: [SequelizeModule.forFeature([HealthInfo])],
  controllers: [HealthInfoController],
  providers: [HealthInfoRepository, HealthInfoService],
  exports: [HealthInfoRepository, HealthInfoService],
})
export class HealthInfoModule {}
