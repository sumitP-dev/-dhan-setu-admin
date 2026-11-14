import { Anchor, EmptyState, Paper, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { IconId } from '@tabler/icons-react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { PAGE_SIZE, type KycStatus } from '../../../api/schemas';
import { PageHeader } from '../../../components/PageHeader';
import { Pager } from '../../../components/Pager';
import { ErrorPanel, LoadingPanel } from '../../../components/QueryState';
import { formatDateTime } from '../../../utils/format';
import { useKycQueue } from '../hooks';
import type { QueueItem } from '../schemas';
import { MatchScore } from '../components/MatchScore';

const VIEWS: { value: KycStatus; label: string }[] = [
  { value: 'pending_review', label: 'Pending approval' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in_progress', label: 'In progress' },
];

const EMPTY_TEXT: Record<KycStatus, string> = {
  pending_review: 'Nothing is waiting for review.',
  verified: 'No one has been verified yet.',
  rejected: 'No KYC has been rejected.',
  in_progress: 'No one is part-way through KYC.',
  not_submitted: '',
};

function QueueTable({ items, status }: { items: QueueItem[]; status: KycStatus }) {
  const navigate = useNavigate();
  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Aadhaar</Table.Th>
            <Table.Th>PAN</Table.Th>
            <Table.Th>Selfie match</Table.Th>
            <Table.Th>{status === 'pending_review' ? 'Waiting since' : 'Submitted'}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map(item => (
            <Table.Tr
              key={item.user_id}
              style={{ cursor: 'pointer' }}
              onClick={event => {
                if (!(event.target as HTMLElement).closest('a')) {
                  void navigate(`/kyc/${item.user_id}`);
                }
              }}
            >
              <Table.Td>
                <Stack gap={0} align="flex-start">
                  <Anchor component={Link} to={`/kyc/${item.user_id}`} fz="sm" fw={500}>
                    {item.full_name}
                  </Anchor>
                  <Text fz="xs" c="dimmed">
                    {item.phone}
                  </Text>
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text fz="sm" ff="monospace">
                  {item.aadhaar ?? '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm" ff="monospace">
                  {item.pan ?? '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <MatchScore score={item.selfie_match_score} />
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{formatDateTime(item.submitted_at)}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export function KycQueuePage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('status');
  const status = VIEWS.find(view => view.value === requested)?.value ?? 'pending_review';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const queue = useKycQueue(status, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="KYC review"
        description="Check each submission, then approve it or reject it with a reason."
      />
      <SegmentedControl
        mb="md"
        data={VIEWS}
        value={status}
        onChange={value =>
          setParams(value === 'pending_review' ? {} : { status: value }, { replace: true })
        }
      />

      {queue.isPending ? (
        <LoadingPanel />
      ) : queue.isError ? (
        <ErrorPanel error={queue.error} onRetry={() => void queue.refetch()} />
      ) : queue.data.items.length === 0 ? (
        <Paper p="xl" radius="md">
          <EmptyState
            icon={<IconId size={28} stroke={1.5} />}
            title="Nothing here"
            description={EMPTY_TEXT[status]}
          />
        </Paper>
      ) : (
        <>
          <Paper radius="md" style={{ opacity: queue.isPlaceholderData ? 0.6 : 1 }}>
            <QueueTable items={queue.data.items} status={status} />
          </Paper>
          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={queue.data.total}
            onChange={next => {
              const nextParams = new URLSearchParams(params);
              if (next > 1) {
                nextParams.set('page', String(next));
              } else {
                nextParams.delete('page');
              }
              setParams(nextParams, { replace: true });
            }}
          />
        </>
      )}
    </>
  );
}
