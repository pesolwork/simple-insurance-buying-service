import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Plan } from 'src/models/plan.model';

@Injectable()
export class PlanRepository extends BaseRepository<Plan> {
  constructor(
    @InjectModel(Plan)
    private _model: typeof Plan,
  ) {
    super(_model);
  }
}
