import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { Customer } from './customer.model';
import { Plan } from './plan.model';
import { PolicyStatus } from 'src/common/enum';
import { Beneficiary } from './beneficiary.model';
import { HealthInfo } from './health-info.model';

@Table({
  tableName: 'policies',
  timestamps: true,
  underscored: true,
})
export class Policy extends Model<Policy> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Plan)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare planId: number;

  @BelongsTo(() => Plan)
  declare plan?: Plan;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
  })
  declare customerId: number;

  @BelongsTo(() => Customer)
  declare customer?: Customer;

  @Column({
    type: DataType.STRING,
  })
  no: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
  })
  declare coverageDetails: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare sumInsured: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare premiumAmount: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare startDate: Date | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare endDate: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(PolicyStatus)),
    allowNull: true,
    defaultValue: PolicyStatus.PendingPayment,
  })
  declare status: PolicyStatus;

  @HasMany(() => Beneficiary)
  declare beneficiaries?: Beneficiary[];

  @HasOne(() => HealthInfo)
  declare healthInfo?: HealthInfo;
}
