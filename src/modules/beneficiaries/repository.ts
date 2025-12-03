import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Beneficiary } from 'src/models/beneficiary.model';

@Injectable()
export class BeneficiaryRepository extends BaseRepository<Beneficiary> {
  constructor(
    @InjectModel(Beneficiary)
    private _model: typeof Beneficiary,
  ) {
    super(_model);
  }
}
