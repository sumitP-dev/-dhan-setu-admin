import type {
  CardNetwork,
  CardType,
  KycStatus,
  RejectionReason,
  UserRole,
  UserStatus,
} from '../api/schemas';

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : '—';
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : '—';
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
}

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_submitted: 'Not submitted',
  in_progress: 'In progress',
  pending_review: 'Pending approval',
  verified: 'Verified',
  rejected: 'Rejected',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_verification: 'Mobile not verified',
  active: 'Active',
  blocked: 'Blocked',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  merchant: 'Merchant',
  admin: 'Admin',
};

export const NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  rupay: 'RuPay',
  amex: 'American Express',
  diners: 'Diners Club',
  maestro: 'Maestro',
  jcb: 'JCB',
  unknown: 'Unknown',
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credit: 'Credit',
  debit: 'Debit',
  prepaid: 'Prepaid',
  unknown: 'Unknown',
};

/** How admins see each rejection reason. */
export const REJECTION_LABELS: Record<RejectionReason, string> = {
  name_mismatch: 'Name doesn’t match the account',
  photo_mismatch: 'Selfie doesn’t match the Aadhaar photo',
  document_issue: 'Problem with the documents',
  other: 'Other',
};

/** What the user is told for each reason (mirrors the backend). */
export const REJECTION_USER_MESSAGES: Record<RejectionReason, string> = {
  name_mismatch: 'The name on your documents doesn’t match your account. Start KYC again.',
  photo_mismatch:
    'Your selfie didn’t clearly match your Aadhaar photo. Start KYC again and take a clear selfie in good light.',
  document_issue: 'There was a problem with your documents. Start KYC again.',
  other: 'Your KYC couldn’t be approved. Start again, or contact support.',
};

export function rejectionLabel(reason: string | null | undefined): string {
  if (!reason) {
    return '—';
  }
  return reason in REJECTION_LABELS ? REJECTION_LABELS[reason as RejectionReason] : reason;
}

/** Options for a Select, from a label map. */
export function selectOptions<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
}
