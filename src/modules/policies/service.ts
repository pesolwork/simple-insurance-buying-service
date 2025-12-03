import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { PolicyRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { PolicyDTO } from './dto/dto';
import { PolicySearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Policy } from 'src/models/policy.model';

@Injectable()
export class PolicyService extends BaseService<Policy, PolicyDTO> {
  constructor(private readonly _repository: PolicyRepository) {
    super(_repository);
  }

  async findAll(
    query?: PolicySearchDTO,
    options?: FindOptions<Policy>,
  ): Promise<ResponseDTO<PolicyDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = ['no'];
      options.where = {
        ...options.where,
        [Op.or]: fields.map((field) => ({
          [field]: {
            [Op.iLike]: search,
          },
        })),
      };
    }

    const fields = ['policyId', 'customerId'];
    for (const value of fields) {
      if (query[value]) {
        options.where[value] = query[value];
      }
    }

    return super.findAll(query, options);
  }
}
