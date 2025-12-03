import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'running_numbers',
  timestamps: true,
  underscored: true,
})
export class RunningNumber extends Model<RunningNumber> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  type: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  prefix: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  currentNumber: number;
}
