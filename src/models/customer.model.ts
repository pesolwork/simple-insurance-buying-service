import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'customers',
  timestamps: true,
  underscored: true,
})
export class Customer extends Model<Customer> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

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
    type: DataType.STRING(13),
    allowNull: false,
  })
  declare idCardNumber: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare dateOfBirth: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare address: string;
}
