import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { PlanRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { PlanDTO } from './dto/dto';
import { PlanSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Plan } from 'src/models/plan.model';
import { ValidatePlanDTO } from './dto/validate-plan.dto';

@Injectable()
export class PlanService extends BaseService<Plan, PlanDTO> {
  constructor(private readonly _repository: PlanRepository) {
    super(_repository);
  }

  async validatePlan(body: ValidatePlanDTO) {
    const plan = await this._repository.findById(body.planId);
    if (!plan) throw new BadRequestException('Plan not found');

    const age =
      new Date().getFullYear() - new Date(body.dateOfBirth).getFullYear();
    if (age < plan.minAge || age > plan.maxAge) {
      throw new BadRequestException(
        `Customer age must be between ${plan.minAge} and ${plan.maxAge}`,
      );
    }

    return new ResponseDTO<any>({ data: { valid: true } });
  }

  async findAll(
    query?: PlanSearchDTO,
    options?: FindOptions<Plan>,
  ): Promise<ResponseDTO<PlanDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.isActive) {
      options.where = {
        ...options.where,
        isActive: query.isActive,
      };
    }

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = ['name', 'coverageDetails'];
      options.where = {
        ...options.where,
        [Op.or]: fields.map((field) => ({
          [field]: {
            [Op.iLike]: search,
          },
        })),
      };
    }

    if (query.age) {
      options.where = {
        ...options.where,
        minAge: {
          [Op.lte]: query.age,
        },
        maxAge: {
          [Op.gte]: query.age,
        },
      };
    }

    if (query.minSumInsured) {
      options.where = {
        ...options.where,
        sumInsured: {
          [Op.gte]: query.minSumInsured,
        },
      };
    }

    return super.findAll(query, options);
  }
}
