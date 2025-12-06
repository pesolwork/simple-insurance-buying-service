import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'otps',
  timestamps: true,
  underscored: true,
})
export class Otp extends Model<Otp> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare otp: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;
}
