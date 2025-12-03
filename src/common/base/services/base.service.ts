import { BaseRepository } from '../repositories/base.repository';
import { CreateOptions, FindOptions } from 'sequelize';
import { Request } from 'express';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { BaseSearchDTO } from '../dto/base-search.dto';
import { ResponseDTO } from '../dto/base-response.dto';

export abstract class BaseService<T extends Model, R> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  async findAll(
    query?: BaseSearchDTO,
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

  async findById(id: any): Promise<ResponseDTO<R>> {
    const data = await this.repository.findById(id);

    if (!data) {
      throw new NotFoundException('Data not found');
    }

    const responseDTO = new ResponseDTO<R>({ data: data.toJSON() });
    return responseDTO;
  }

  async create(data: any, options?: CreateOptions<T>): Promise<ResponseDTO<R>> {
    const result = await this.repository.create(data, options);
    const responseDTO = new ResponseDTO<R>({ data: result?.toJSON() });
    return responseDTO;
  }

  async update(id: any, data: any): Promise<ResponseDTO<R>> {
    const [count, arr] = await this.repository.update(data, {
      where: { id },
    });

    if (!count) {
      throw new BadRequestException('Data not found');
    }

    const responseDTO = new ResponseDTO<R>({ data: arr[0]?.toJSON() });
    return responseDTO;
  }

  async delete(id: any, req?: Request): Promise<ResponseDTO<number>> {
    const data = await this.repository.findById(id);
    if (!data) {
      throw new BadRequestException('Data not found');
    }
    const result = await this.repository.delete({ where: { id } });
    const responseDTO = new ResponseDTO<number>({ data: result[0] });
    return responseDTO;
  }
}
