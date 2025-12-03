import { ApiProperty } from '@nestjs/swagger';

export class PolicyPaymentQrResponseDTO {
  @ApiProperty({ example: 10 })
  policyId: number;

  @ApiProperty({ example: 'TXN-20250101-0001' })
  transactionRef: string;

  @ApiProperty({ example: 'https://example.com/qr-code.png' })
  qrCode: string;
}
