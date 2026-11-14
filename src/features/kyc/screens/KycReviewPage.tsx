import {
  Alert,
  Anchor,
  Badge,
  Button,
  EmptyState,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconCheck, IconId, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { toApiError } from '../../../api/errors';
import { DetailList } from '../../../components/DetailList';
import { ErrorPanel, LoadingPanel } from '../../../components/QueryState';
import { KycStatusBadge } from '../../../components/StatusBadge';
import { useAppSelector } from '../../../store';
import {
  KYC_STATUS_LABELS,
  formatDate,
  formatDateTime,
  rejectionLabel,
} from '../../../utils/format';
import { ApproveModal, RejectModal } from '../components/DecisionModals';
import { MatchScore } from '../components/MatchScore';
import { useKycDecision, useKycReview } from '../hooks';
import type { ReviewDetail } from '../schemas';

const GENDER_LABELS: Record<string, string> = { M: 'Male', F: 'Female', T: 'Transgender' };

const EVENT_LABELS: Record<string, string> = {
  digilocker_completed: 'Documents fetched from DigiLocker',
  submitted: 'Submitted for review',
  approved: 'Approved',
};

function Check({ ok, yes, no }: { ok: boolean | null; yes: string; no: string }) {
  if (ok === null) {
    return (
      <Text fz="sm" c="dimmed">
        —
      </Text>
    );
  }
  return (
    <Badge
      variant="light"
      color={ok ? 'teal' : 'red'}
      radius="sm"
      tt="none"
      fw={500}
      leftSection={ok ? <IconCheck size={12} /> : <IconX size={12} />}
    >
      {ok ? yes : no}
    </Badge>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper p="lg" radius="md">
      <Text fw={600} fz="sm" mb="md">
        {title}
      </Text>
      {children}
    </Paper>
  );
}

function BackLink() {
  return (
    <Anchor component={Link} to="/kyc" fz="sm" c="dimmed">
      <Group gap={4} wrap="nowrap">
        <IconArrowLeft size={14} stroke={1.5} />
        KYC review
      </Group>
    </Anchor>
  );
}

function DocumentsSection({ review }: { review: ReviewDetail }) {
  const details = review.details;
  if (!details) {
    return (
      <Section title="Documents">
        <Text fz="sm" c="dimmed">
          No documents fetched yet.
        </Text>
      </Section>
    );
  }
  return (
    <Section title="Documents (from DigiLocker)">
      <DetailList
        items={[
          { label: 'Name on Aadhaar', value: details.name },
          {
            label: 'Matches account name',
            value: <Check ok={review.account_name_matches} yes="Matches" no="Doesn’t match" />,
          },
          {
            label: 'Date of birth',
            value: details.date_of_birth
              ? formatDate(details.date_of_birth)
              : `Year ${details.birth_year}`,
          },
          { label: 'Gender', value: GENDER_LABELS[details.gender] ?? details.gender },
          {
            label: 'Aadhaar',
            value: (
              <Text ff="monospace" fz="sm">
                {details.aadhaar}
              </Text>
            ),
          },
          {
            label: 'PAN',
            value: details.pan ? (
              <Group gap={6}>
                <Text ff="monospace" fz="sm">
                  {details.pan}
                </Text>
                <Text fz="xs" c="dimmed">
                  {review.pan_source === 'manual' ? 'entered by user' : 'from DigiLocker'}
                </Text>
              </Group>
            ) : null,
          },
          {
            label: 'PAN check',
            value: (
              <Stack gap={4}>
                <Check
                  ok={details.pan ? details.pan_verified : null}
                  yes="Verified"
                  no="Not verified"
                />
                {details.pan_issue_message && (
                  <Text fz="xs" c="red">
                    {details.pan_issue_message}
                  </Text>
                )}
              </Stack>
            ),
          },
          { label: 'Fetched', value: formatDateTime(details.fetched_at) },
          { label: 'Address', value: details.address },
        ]}
      />
    </Section>
  );
}

function SelfieSection({ review }: { review: ReviewDetail }) {
  const selfie = review.selfie;
  return (
    <Section title="Selfie">
      {selfie ? (
        <DetailList
          items={[
            { label: 'Liveness', value: <Check ok={selfie.is_live} yes="Live" no="Not live" /> },
            {
              label: `Face match (pass mark ${selfie.min_match_score}%)`,
              value: <MatchScore score={selfie.match_score} min={selfie.min_match_score} />,
            },
            { label: 'Taken', value: formatDateTime(selfie.completed_at) },
          ]}
        />
      ) : (
        <Text fz="sm" c="dimmed">
          No selfie yet.
        </Text>
      )}
    </Section>
  );
}

function HistorySection({ review, adminId }: { review: ReviewDetail; adminId?: string }) {
  if (review.events.length === 0) {
    return null;
  }
  return (
    <Section title="History">
      <Timeline bulletSize={10} lineWidth={1}>
        {review.events.map(event => {
          const rejected = event.to_status === 'rejected';
          const title = rejected
            ? `Rejected: ${rejectionLabel(event.reason)}`
            : (EVENT_LABELS[event.reason] ?? KYC_STATUS_LABELS[event.to_status]);
          return (
            <Timeline.Item
              key={`${event.created_at}-${event.to_status}`}
              title={
                <Text fz="sm" fw={500}>
                  {title}
                </Text>
              }
            >
              <Text fz="xs" c="dimmed">
                {formatDateTime(event.created_at)}
                {event.actor_id && (event.actor_id === adminId ? ' · by you' : ' · by an admin')}
              </Text>
              {event.note && (
                <Text fz="sm" mt={4}>
                  “{event.note}”
                </Text>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Section>
  );
}

export function KycReviewPage() {
  const { userId = '' } = useParams();
  const admin = useAppSelector(state => state.auth.admin);
  const review = useKycReview(userId);
  const decision = useKycDecision(userId);
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null);

  if (review.isPending) {
    return <LoadingPanel />;
  }
  if (review.isError) {
    const error = toApiError(review.error);
    if (error.status === 404 || error.status === 422) {
      return (
        <Stack gap="md">
          <BackLink />
          <Paper p="xl" radius="md">
            <EmptyState
              icon={<IconId size={28} stroke={1.5} />}
              title="User not found"
              description="This user doesn’t exist, or the link is wrong."
            />
          </Paper>
        </Stack>
      );
    }
    return <ErrorPanel error={review.error} onRetry={() => void review.refetch()} />;
  }

  const data = review.data;
  const own = admin?.id === data.account.id;
  const pending = data.kyc_status === 'pending_review';
  const decisionError = decision.error ? toApiError(decision.error) : null;
  const close = () => {
    setModal(null);
    decision.reset();
  };
  // Close on success, and on a conflict (someone decided first): the page then shows
  // the new status and why. Other errors stay in the dialog so the admin can retry.
  const settle = (_data: unknown, error: unknown) => {
    if (!error || toApiError(error).status === 409) {
      setModal(null);
    }
  };

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <BackLink />
        <Group justify="space-between" align="flex-end">
          <Stack gap={2}>
            <Group gap="sm">
              <Title order={2} fz="h3">
                {data.account.full_name}
              </Title>
              <KycStatusBadge status={data.kyc_status} />
            </Group>
            <Text c="dimmed" fz="sm">
              {data.submitted_at
                ? `Submitted ${formatDateTime(data.submitted_at)}`
                : 'Not submitted'}
            </Text>
          </Stack>
          {data.can_decide && (
            <Group gap="sm">
              <Button
                variant="default"
                color="red"
                leftSection={<IconX size={16} stroke={1.5} />}
                onClick={() => setModal('reject')}
              >
                Reject
              </Button>
              <Button
                color="teal"
                leftSection={<IconCheck size={16} stroke={1.5} />}
                onClick={() => setModal('approve')}
              >
                Approve
              </Button>
            </Group>
          )}
        </Group>
      </Stack>

      {pending && own && (
        <Alert color="yellow">This is your own KYC. Another admin has to review it.</Alert>
      )}
      {decision.isSuccess && (
        <Alert color={data.kyc_status === 'verified' ? 'teal' : 'gray'} role="status">
          {data.kyc_status === 'verified'
            ? 'KYC approved. The user can now save cards and make payments.'
            : 'KYC rejected. The user has been told why and can start again.'}
        </Alert>
      )}
      {!modal && decisionError?.status === 409 && (
        <Alert color="yellow" role="alert">
          {decisionError.message}
        </Alert>
      )}

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            <DocumentsSection review={data} />
            <SelfieSection review={data} />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            <Section title="Account">
              <DetailList
                cols={1}
                items={[
                  { label: 'Account name', value: data.account.full_name },
                  { label: 'Email', value: data.account.email },
                  { label: 'Phone', value: data.account.phone },
                  { label: 'Joined', value: formatDate(data.account.created_at) },
                ]}
              />
              <Anchor
                component={Link}
                to={`/users/${data.account.id}`}
                fz="sm"
                mt="md"
                display="block"
              >
                Open user profile
              </Anchor>
            </Section>
            <HistorySection review={data} adminId={admin?.id} />
          </Stack>
        </Grid.Col>
      </Grid>

      <ApproveModal
        opened={modal === 'approve'}
        name={data.account.full_name}
        pending={decision.isPending}
        error={decisionError?.message ?? null}
        onClose={close}
        onConfirm={() => decision.mutate({ kind: 'approve' }, { onSettled: settle })}
      />
      <RejectModal
        opened={modal === 'reject'}
        name={data.account.full_name}
        pending={decision.isPending}
        error={decisionError?.message ?? null}
        onClose={close}
        onConfirm={({ reason, note }) =>
          decision.mutate({ kind: 'reject', reason, note }, { onSettled: settle })
        }
      />
    </Stack>
  );
}
