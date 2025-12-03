import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { BeneficiaryRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { BeneficiaryDTO } from './dto/dto';
import { BeneficiarySearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Beneficiary } from 'src/models/beneficiary.model';

@Injectable()
export class BeneficiaryService extends BaseService<
  Beneficiary,
  BeneficiaryDTO
> {
  constructor(private readonly _repository: BeneficiaryRepository) {
    super(_repository);
  }

  async findAll(
    query?: BeneficiarySearchDTO,
    options?: FindOptions<Beneficiary>,
  ): Promise<ResponseDTO<BeneficiaryDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = ['firstName', 'lastName'];
      options.where = {
        ...options.where,
        [Op.or]: fields.map((field) => ({
          [field]: {
            [Op.iLike]: search,
          },
        })),
      };
    }

    const fields = ['policyId'];
    for (const value of fields) {
      if (query[value]) {
        options.where[value] = query[value];
      }
    }

    return super.findAll(query, options);
  }
}
