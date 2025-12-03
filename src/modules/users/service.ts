import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/services/base.service';
import { UserRepository } from './repository';
import { FindOptions, Op } from 'sequelize';
import { UserDTO } from './dto/dto';
import { User } from 'src/models/user.model';
import { UserSearchDTO } from './dto/search.dto';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';

@Injectable()
export class UserService extends BaseService<User, UserDTO> {
  constructor(private readonly _repository: UserRepository) {
    super(_repository);
  }

  async findAll(
    query?: UserSearchDTO,
    options?: FindOptions<User>,
  ): Promise<ResponseDTO<UserDTO[]>> {
    options = options || {};
    options.where = options.where || {};

    if (query.search) {
      const search = `%${query.search}%`;
      const fields = ['email'];
      options.where = {
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
