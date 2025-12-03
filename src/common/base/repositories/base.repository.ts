import {
  CreateOptions,
  DestroyOptions,
  FindOptions,
  UpdateOptions,
} from 'sequelize';
import { Model, ModelCtor } from 'sequelize-typescript';

export abstract class BaseRepository<T extends Model<T>> {
  constructor(protected readonly model: ModelCtor) {
    model.beforeUpdate((instance) => {
      instance.updatedAt = new Date();
    });
  }

  getModel() {
    return this.model;
  }

  async count(options?: FindOptions<T>): Promise<number> {
    return this.model.count(options);
  }

  async findOne(options?: FindOptions<T>): Promise<T> {
    return this.model.findOne(options) as Promise<T>;
  }

  async findAndCountAll(
    options?: FindOptions<T>,
  ): Promise<{ rows: T[]; count: number }> {
    return this.model.findAndCountAll(options) as Promise<{
      rows: T[];
      count: number;
    }>;
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    return this.model.findAll(options) as Promise<T[]>;
  }

  async findById(
    id: any,
    options?: Omit<FindOptions<any>, 'where'>,
  ): Promise<T> {
    return this.model.findByPk(id, options) as Promise<T>;
  }

  async bulkCreate(
    data: Partial<T>[],
    options?: CreateOptions<T>,
  ): Promise<T[]> {
    return this.model.bulkCreate(data, {
      ...options,
      returning: true,
    }) as Promise<T[]>;
  }

  async create(data: Partial<T>, options?: CreateOptions<T>): Promise<T> {
    return this.model.create(data, {
      ...options,
      returning: true,
    }) as Promise<T>;
  }

  async update(
    data: Partial<T>,
    options?: UpdateOptions<T>,
  ): Promise<[number, T[]]> {
    return this.model.update(data, {
      ...options,
      returning: true,
    }) as Promise<[number, T[]]>;
  }

  async delete(options?: DestroyOptions<T>): Promise<number> {
    return this.model.destroy({ ...options });
  }
}
