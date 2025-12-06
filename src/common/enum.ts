export enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  // User = 'user',
  Customer = 'customer',
}

export enum PolicyStatus {
  PendingPayment = 'pending_payment',
  Active = 'active',
  Expired = 'expired',
}

export enum TransactionStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
}

export enum PaymentMethod {
  Promptpay = 'promptpay',
  // CreditCard = 'credit_card',
}

export enum RunningNumberType {
  Policy = 'policy',
  Claim = 'claim',
}

export enum ClaimStatus {
  PendingReview = 'pending_review',
  RequestingDocs = 'requesting_docs',
  Approved = 'approved',
  Rejected = 'rejected',
  Paid = 'paid',
}
