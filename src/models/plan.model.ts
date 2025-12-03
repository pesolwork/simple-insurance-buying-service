import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'plans',
  timestamps: true,
  underscored: true,
})
export class Plan extends Model<Plan> {
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
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare coverageDetails: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare minAge: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare maxAge: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare sumInsured: string; // DECIMAL → string (Sequelize)

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare premiumAmount: string; // DECIMAL → string

  @Column({
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;
}
