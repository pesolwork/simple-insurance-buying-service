import { ApiProperty } from '@nestjs/swagger';
import { Model } from 'sequelize-typescript';

export class BaseDTO {
  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Created at timestamp',
    required: false,
    type: Date,
    example: '2023-01-01T00:00:00Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    required: false,
    type: Date,
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt?: Date;

  constructor(partial: Partial<BaseDTO>) {
    if (partial instanceof Model) {
      Object.assign(this, partial.toJSON());
    } else {
      Object.assign(this, partial);
    }
  }
}
