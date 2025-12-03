import { FindOptions } from 'sequelize';
import { BaseRepository } from '../repositories/base.repository';
import { Model } from 'sequelize-typescript';
import { BaseSearchDTO } from '../dto/base-search.dto';
import { ResponseDTO } from '../dto/base-response.dto';

export abstract class BaseAssociationService<T extends Model, R = any> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  async baseFindAll(
    query: BaseSearchDTO,
    options?: FindOptions<T>,
  ): Promise<ResponseDTO<R[]>> {
    options = options || {};
    options.where = options.where || {};
    options.offset = (query.page - 1) * query.limit;
    options.limit = query.limit;
    options.order = query?.sortBy
      ? [[query.sortBy, query.sortOrder || 'ASC']]
      : [['id', 'DESC']];

    const responseDTO = new ResponseDTO<R[]>();
    if (query.count) {
      const { count, rows } = await this.repository.findAndCountAll(options);
      responseDTO.metadata.total = count;
      responseDTO.data = rows.map((item) => item.toJSON());
    } else {
      const data = await this.repository.findAll(options);
      responseDTO.data = data.map((item) => item.toJSON());
    }

    responseDTO.metadata.page = query.page;
    responseDTO.metadata.limit = query.limit;
    responseDTO.metadata.totalPage = Math.ceil(
      responseDTO.metadata.total / query.limit,
    );

    return responseDTO;
  }
}
