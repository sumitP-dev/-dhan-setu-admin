import { EmptyState, Paper } from '@mantine/core';
import { IconId } from '@tabler/icons-react';

import { PageHeader } from '../../../components/PageHeader';

// The review queue and decision screens arrive in A3.
export function KycQueuePage() {
  return (
    <>
      <PageHeader title="KYC review" description="Submissions waiting for a decision." />
      <Paper p="xl" radius="md">
        <EmptyState
          icon={<IconId size={28} stroke={1.5} />}
          title="Review queue coming next"
          description="Submitted KYC will be listed here for approval."
        />
      </Paper>
    </>
  );
}
