import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Claim } from 'src/models/claim.model';

@Injectable()
export class ClaimRepository extends BaseRepository<Claim> {
  constructor(
    @InjectModel(Claim)
    private _model: typeof Claim,
  ) {
    super(_model);
  }
}
