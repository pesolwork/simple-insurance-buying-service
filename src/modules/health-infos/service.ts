import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { HealthInfoRepository } from './repository';
import { FindOptions } from 'sequelize';
import { HealthInfoDTO } from './dto/dto';
import { HealthInfoSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { HealthInfo } from 'src/models/health-info.model';

@Injectable()
export class HealthInfoService extends BaseService<HealthInfo, HealthInfoDTO> {
  constructor(private readonly _repository: HealthInfoRepository) {
    super(_repository);
  }

  async findAll(
    query?: HealthInfoSearchDTO,
    options?: FindOptions<HealthInfo>,
  ): Promise<ResponseDTO<HealthInfoDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    const fields = ['policyId'];

    for (const value of fields) {
      if (query[value]) {
        options.where[value] = query[value];
      }
    }

    return super.findAll(query, options);
  }
}
