import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CustomerRepository } from './repository';
import { CustomerService } from './service';
import { CustomerController } from './controller';
import { Customer } from 'src/models/customer.model';

@Module({
  imports: [SequelizeModule.forFeature([Customer])],
  controllers: [CustomerController],
  providers: [CustomerRepository, CustomerService],
  exports: [CustomerRepository, CustomerService],
})
export class CustomerModule {}
