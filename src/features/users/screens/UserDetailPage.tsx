import { Anchor, Button, EmptyState, Group, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconCreditCard, IconId, IconUser } from '@tabler/icons-react';
import { Link, useParams, useSearchParams } from 'react-router';

import { toApiError } from '../../../api/errors';
import { DetailList } from '../../../components/DetailList';
import { ErrorPanel, LoadingPanel } from '../../../components/QueryState';
import { KycStatusBadge, UserStatusBadge } from '../../../components/StatusBadge';
import { ROLE_LABELS, formatDateTime, rejectionLabel } from '../../../utils/format';
import { CardsTable } from '../../cards/components/CardsTable';
import { useUser } from '../hooks';
import type { UserDetail } from '../schemas';

const TABS = ['profile', 'kyc', 'cards'] as const;
type Tab = (typeof TABS)[number];

function BackLink() {
  return (
    <Anchor component={Link} to="/users" fz="sm" c="dimmed">
      <Group gap={4} wrap="nowrap">
        <IconArrowLeft size={14} stroke={1.5} />
        Users
      </Group>
    </Anchor>
  );
}

function ProfileTab({ user }: { user: UserDetail }) {
  return (
    <DetailList
      cols={3}
      items={[
        { label: 'Full name', value: user.full_name },
        { label: 'Email', value: user.email },
        { label: 'Phone', value: user.phone },
        { label: 'Role', value: ROLE_LABELS[user.role] },
        { label: 'Account status', value: <UserStatusBadge status={user.status} /> },
        { label: 'Joined', value: formatDateTime(user.created_at) },
        {
          label: 'Last sign-in',
          value: user.last_login_at ? formatDateTime(user.last_login_at) : 'Never',
        },
        {
          label: 'User ID',
          value: (
            <Text fz="xs" ff="monospace">
              {user.id}
            </Text>
          ),
        },
      ]}
    />
  );
}

function KycTab({ user }: { user: UserDetail }) {
  const { kyc } = user;
  const rejected = kyc.status === 'rejected';
  return (
    <Stack gap="lg">
      <DetailList
        cols={3}
        items={[
          { label: 'Status', value: <KycStatusBadge status={kyc.status} /> },
          { label: 'Submitted', value: formatDateTime(kyc.submitted_at) },
          { label: 'Decided', value: formatDateTime(kyc.decided_at) },
          { label: 'Decided by', value: kyc.decided_by },
          ...(rejected
            ? [
                { label: 'Rejection reason', value: rejectionLabel(kyc.rejection_reason) },
                { label: 'Internal note', value: kyc.rejection_note },
              ]
            : []),
        ]}
      />
      {kyc.status !== 'not_submitted' && (
        <Group>
          <Button
            component={Link}
            to={`/kyc/${user.id}`}
            variant={kyc.status === 'pending_review' ? 'filled' : 'default'}
            leftSection={<IconId size={16} stroke={1.5} />}
          >
            {kyc.status === 'pending_review' ? 'Review KYC' : 'Open KYC details'}
          </Button>
        </Group>
      )}
      {kyc.status === 'not_submitted' && (
        <Text fz="sm" c="dimmed">
          This user hasn’t started KYC yet.
        </Text>
      )}
    </Stack>
  );
}

function CardsTab({ user }: { user: UserDetail }) {
  if (user.cards.length === 0) {
    return (
      <EmptyState
        icon={<IconCreditCard size={28} stroke={1.5} />}
        title="No cards"
        description="This user hasn’t saved a card."
      />
    );
  }
  return <CardsTable cards={user.cards} />;
}

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const user = useUser(userId);

  const requested = params.get('tab');
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : 'profile';

  if (user.isPending) {
    return <LoadingPanel />;
  }
  if (user.isError) {
    const error = toApiError(user.error);
    // A malformed id (422) means the same as an unknown one.
    if (error.status === 404 || error.status === 422) {
      return (
        <Stack gap="md">
          <BackLink />
          <Paper p="xl" radius="md">
            <EmptyState
              icon={<IconUser size={28} stroke={1.5} />}
              title="User not found"
              description="This user doesn’t exist, or the link is wrong."
            />
          </Paper>
        </Stack>
      );
    }
    return <ErrorPanel error={user.error} onRetry={() => void user.refetch()} />;
  }

  const data = user.data;
  const removed = data.cards.length - data.active_cards;
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <BackLink />
        <Group justify="space-between" align="flex-end">
          <Stack gap={2}>
            <Title order={2} fz="h3">
              {data.full_name}
            </Title>
            <Text c="dimmed" fz="sm">
              {data.email} · {data.phone}
            </Text>
          </Stack>
          <Group gap="xs">
            <UserStatusBadge status={data.status} />
            <KycStatusBadge status={data.kyc_status} />
          </Group>
        </Group>
      </Stack>

      <Paper radius="md">
        <Tabs
          value={tab}
          onChange={value =>
            setParams(value && value !== 'profile' ? { tab: value } : {}, { replace: true })
          }
        >
          <Tabs.List px="md">
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} stroke={1.5} />}>
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="kyc" leftSection={<IconId size={16} stroke={1.5} />}>
              KYC
            </Tabs.Tab>
            <Tabs.Tab value="cards" leftSection={<IconCreditCard size={16} stroke={1.5} />}>
              Cards ({data.active_cards}
              {removed > 0 ? ` + ${removed} removed` : ''})
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="profile" p="lg">
            <ProfileTab user={data} />
          </Tabs.Panel>
          <Tabs.Panel value="kyc" p="lg">
            <KycTab user={data} />
          </Tabs.Panel>
          <Tabs.Panel value="cards" p={data.cards.length ? 0 : 'lg'}>
            <CardsTab user={data} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
}
