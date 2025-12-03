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
  tableName: 'health_infos',
  timestamps: true,
  underscored: true,
})
export class HealthInfo extends Model<HealthInfo> {
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
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare smoking: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare drinking: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare detail: string | null;
}
