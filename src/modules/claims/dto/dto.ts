import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from 'src/common/enum';

export class ClaimDTO {
  @ApiProperty({ example: 1 })
  id: number;

  // ---------- policy_id ----------
  @ApiProperty({ example: 101, nullable: true })
  policyId: number | null;

  // ---------- customer_id ----------
  @ApiProperty({ example: 55, nullable: true })
  customerId: number | null;

  // ---------- created_by_id ----------
  @ApiProperty({ example: 3, nullable: true })
  createdById: number | null;

  // ---------- Claim Number ----------
  @ApiProperty({ example: 'CLM-2025-00001', nullable: true })
  claimNumber: string | null;

  // ---------- Incident Date ----------
  @ApiProperty({ example: '2025-12-06' })
  incidentDate: string;

  // ---------- Description ----------
  @ApiProperty({
    example: 'The insured vehicle was damaged in a collision.',
    nullable: true,
  })
  incidentDescription: string | null;

  // ---------- Amount ----------
  @ApiProperty({ example: '15000.00', nullable: true })
  claimAmount: string | null;

  // ---------- Status ----------
  @ApiProperty({
    enum: ClaimStatus,
    example: ClaimStatus.PendingReview,
  })
  status: ClaimStatus;
}
