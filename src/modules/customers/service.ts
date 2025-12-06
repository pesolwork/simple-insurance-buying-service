import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { CustomerRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { CustomerDTO } from './dto/dto';
import { CustomerSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Customer } from 'src/models/customer.model';
import { CreateCustomerDTO } from './dto/create.dto';
import * as bcrypt from 'bcrypt';
import { UserDTO } from '../users/dto/dto';
import { UserService } from '../users/service';
import { UserRole } from 'src/common/enum';

@Injectable()
export class CustomerService extends BaseService<Customer, CustomerDTO> {
  constructor(
    private readonly _repository: CustomerRepository,
    private readonly usersService: UserService,
  ) {
    super(_repository);
  }

  async getProfile(userId: number): Promise<ResponseDTO<CustomerDTO>> {
    const data = await this._repository.findOne({
      where: {
        userId,
      },
    });

    if (!data) {
      throw new BadRequestException('Data not found');
    }

    return new ResponseDTO({ data: new CustomerDTO(data) });
  }

  async register(body: CreateCustomerDTO): Promise<ResponseDTO<CustomerDTO>> {
    const { data: user } = await this.usersService.findByEmail(body.email);

    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const transaction = await this._repository
      .getModel()
      .sequelize.transaction();

    try {
      const hashedPassword = await bcrypt.hash(body.password, 10);

      const { data: newUser }: ResponseDTO<UserDTO> =
        await this.usersService.create(
          {
            email: body.email,
            password: hashedPassword,
            role: UserRole.Customer,
          },
          { transaction },
        );

      const { password: _, ...customerData } = body;
      const newCustomer = await this._repository.create(
        {
          ...customerData,
          userId: newUser.id,
        },
        { transaction },
      );

      await transaction.commit();

      const dto = new CustomerDTO(newCustomer);
      return new ResponseDTO({ data: dto });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async validateEmail(email: string) {
    const { data: user } = await this.usersService.findByEmail(email);

    if (user) {
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
