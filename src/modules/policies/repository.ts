import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Policy } from 'src/models/policy.model';

@Injectable()
export class PolicyRepository extends BaseRepository<Policy> {
  constructor(
    @InjectModel(Policy)
    private _model: typeof Policy,
  ) {
    super(_model);
  }
}
