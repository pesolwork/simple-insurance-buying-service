import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BaseSearchDTO {
  @ApiProperty({
    description: 'Search term',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    type: Number,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) {
        throw new Error('Invalid page number');
      }
      return parsedValue;
    }
    return 1;
  })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) {
        throw new Error('Invalid page number');
      }
      return parsedValue;
    }
    return 10;
  })
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    required: false,
    type: String,
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiProperty({
    description: 'Filter by field',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  between?: string;

  @ApiProperty({
    description: 'Start date for filtering',
    required: false,
    type: Date,
    example: '2023-01-01T00:00:00Z',
  })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const parsedValue = new Date(value);
      if (isNaN(parsedValue.getTime())) {
        throw new Error('Invalid date');
      }
      return parsedValue;
    }
    return undefined;
  })
  startDate?: Date;

  @ApiProperty({
    description: 'End date for filtering',
    required: false,
    type: Date,
    example: '2023-12-31T23:59:59Z',
  })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const parsedValue = new Date(value);
      if (isNaN(parsedValue.getTime())) {
        throw new Error('Invalid date');
      }
      return parsedValue;
    }
    return undefined;
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Count of items',
    required: false,
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      const parsedValue = value.toLowerCase() === 'true';
      if (parsedValue === undefined) {
        throw new Error('Invalid boolean value');
      }
      return parsedValue;
    }
    return true;
  })
  count?: boolean;
}
