import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseRepository } from 'src/common/base/repositories/base.repository';
import { Customer } from 'src/models/customer.model';

@Injectable()
export class CustomerRepository extends BaseRepository<Customer> {
  constructor(
    @InjectModel(Customer)
    private _model: typeof Customer,
  ) {
    super(_model);
  }
}
