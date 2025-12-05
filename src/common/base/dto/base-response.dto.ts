import { ApiProperty } from '@nestjs/swagger';

export class Metadata {
  @ApiProperty({ description: 'total' })
  total: number;
  @ApiProperty({ description: 'page' })
  page: number;
  @ApiProperty({ description: 'limit' })
  limit: number;
  @ApiProperty({ description: 'total page' })
  totalPage?: number;
}

export class ResponseDTO<T> {
  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Response status' })
  status?: string | 'success';

  @ApiProperty({ description: 'Response message' })
  message?: string;

  @ApiProperty({ description: 'Response metadata' })
  metadata: Metadata;

  constructor(paylod?: Partial<ResponseDTO<T>>) {
    this.data = paylod?.data;
    this.status = paylod?.status || 'ok';
    this.message = paylod?.message;
    this.metadata = paylod?.metadata || new Metadata();
  }
}
