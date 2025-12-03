import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { HealthInfo } from 'src/models/health-info.model';

@Injectable()
export class HealthInfoRepository extends BaseRepository<HealthInfo> {
  constructor(
    @InjectModel(HealthInfo)
    private _model: typeof HealthInfo,
  ) {
    super(_model);
  }
}
