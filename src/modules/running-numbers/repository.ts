import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { RunningNumber } from 'src/models/running-number.model';

@Injectable()
export class RunningNumberRepository extends BaseRepository<RunningNumber> {
  constructor(
    @InjectModel(RunningNumber)
    private _model: typeof RunningNumber,
  ) {
    super(_model);
  }
}
