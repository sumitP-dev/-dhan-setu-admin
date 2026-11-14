import { Badge } from '@mantine/core';

import type { CardStatus, KycStatus, UserStatus } from '../api/schemas';
import { KYC_STATUS_LABELS, USER_STATUS_LABELS } from '../utils/format';

// Colour only where it carries meaning; everything else stays grey.
const KYC_COLORS: Record<KycStatus, string> = {
  not_submitted: 'gray',
  in_progress: 'gray',
  pending_review: 'yellow',
  verified: 'teal',
  rejected: 'red',
};

const USER_COLORS: Record<UserStatus, string> = {
  pending_verification: 'gray',
  active: 'teal',
  blocked: 'red',
};

export function KycStatusBadge({ status }: { status: KycStatus }) {
  return (
    <Badge variant="light" color={KYC_COLORS[status]} radius="sm" tt="none" fw={500}>
      {KYC_STATUS_LABELS[status]}
    </Badge>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="light" color={USER_COLORS[status]} radius="sm" tt="none" fw={500}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CardStatusBadge({ status }: { status: CardStatus }) {
  return (
    <Badge
      variant="light"
      color={status === 'active' ? 'teal' : 'gray'}
      radius="sm"
      tt="none"
      fw={500}
    >
      {status === 'active' ? 'Active' : 'Removed'}
    </Badge>
  );
}
