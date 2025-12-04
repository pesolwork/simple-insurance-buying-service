import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { CustomerRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { CustomerDTO } from './dto/dto';
import { CustomerSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Customer } from 'src/models/customer.model';

@Injectable()
export class CustomerService extends BaseService<Customer, CustomerDTO> {
  constructor(private readonly _repository: CustomerRepository) {
    super(_repository);
  }

  async validateEmail(email: string) {
    const customer = await this._repository.findOne({
      where: { email },
    });

    if (customer) {
      throw new BadRequestException('Email already exists');
    }

    return new ResponseDTO<any>({ data: { valid: true } });
  }

  async findAll(
    query?: CustomerSearchDTO,
    options?: FindOptions<Customer>,
  ): Promise<ResponseDTO<CustomerDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = [
        'firstName',
        'lastName',
        'idCardNumber',
        'phone',
        'email',
      ];
      options.where = {
        ...options.where,
        [Op.or]: fields.map((field) => ({
          [field]: {
            [Op.iLike]: search,
          },
        })),
      };
    }

    return super.findAll(query, options);
  }
}
