import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Policy } from './policy.model';
import { Customer } from './customer.model';
import { User } from './user.model';
import { ClaimStatus } from 'src/common/enum';

@Table({
  tableName: 'claims',
  timestamps: true,
  underscored: true,
})
export class Claim extends Model<Claim> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  // ---------- FK: policy_id ----------
  @ForeignKey(() => Policy)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare policyId: number;

  @BelongsTo(() => Policy)
  declare policy: Policy;

  // ---------- FK: customer_id ----------
  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare ustomerId: number;

  @BelongsTo(() => Customer)
  declare customer: Customer;

  // ---------- FK: created_by_id ----------
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare createdById: number;

  @BelongsTo(() => User)
  declare createdBy: User;

  // ---------- Claim Number ----------
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare claimNumber: string;

  // ---------- Incident Date ----------
  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare incidentDate: string;

  // ---------- Description ----------
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare incidentDescription: string;

  // ---------- Amount ----------
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare claimAmount: string;

  // ---------- Status ----------
  @Default(ClaimStatus.PendingReview)
  @Column({
    type: DataType.ENUM(...Object.values(ClaimStatus)),
  })
  declare status: ClaimStatus;
}
