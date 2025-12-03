import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Policy } from './policy.model';

@Table({
  tableName: 'beneficiaries',
  timestamps: true,
  underscored: true,
})
export class Beneficiary extends Model<Beneficiary> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Policy)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare policyId: number | null;

  @BelongsTo(() => Policy)
  declare policy?: Policy;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare relationship: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare percentage: number;
}
