import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Policy } from './policy.model';
import { TransactionStatus } from 'src/common/enum';

@Table({
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
})
export class Transaction extends Model<Transaction> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Policy)
  @Column({
    type: DataType.INTEGER,
  })
  declare policyId: number;

  @BelongsTo(() => Policy)
  declare policy?: Policy;

  @Column({
    type: DataType.STRING,
  })
  declare transactionRef: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare expectedAmount: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
  })
  declare paidAmount: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare paymentMethod: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare paidAt: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionStatus)),
    defaultValue: TransactionStatus.Pending,
    allowNull: true,
  })
  declare status: TransactionStatus;
}
