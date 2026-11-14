import { Alert, Button, Center, Loader, Paper } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

import { toApiError } from '../api/errors';

export function LoadingPanel() {
  return (
    <Center py="xl">
      <Loader size="sm" />
    </Center>
  );
}

/** A failed request: the server's message and a retry button. */
export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = toApiError(error);
  return (
    <Paper p="md" radius="md">
      <Alert
        color="red"
        icon={<IconAlertCircle size={18} stroke={1.5} />}
        title="Couldn’t load this"
        role="alert"
      >
        {apiError.message}
        {onRetry && (
          <Button variant="default" size="xs" mt="sm" display="block" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Alert>
    </Paper>
  );
}
