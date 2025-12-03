import { PolicyStatus } from 'src/common/enum';

export const policyStatusMap = {
  [PolicyStatus.Active]: 'มีผลคุ้มครอง',
  [PolicyStatus.Expired]: 'สิ้นสุดความคุ้มครอง',
  [PolicyStatus.PendingPayment]: 'รอชำระเบี้ย',
};
