import { Alert, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { BrandMark } from '../../../components/BrandMark';
import { useAppSelector, type SignOutReason } from '../../../store';
import { CodeStep } from '../components/CodeStep';
import { CredentialsStep } from '../components/CredentialsStep';
import type { Challenge, Credentials } from '../schemas';

const REASON_MESSAGES: Record<SignOutReason, string | null> = {
  signed_out: null,
  idle: 'You were signed out after 15 minutes without activity.',
  expired: 'Your session has ended. Sign in again.',
};

interface Pending {
  challenge: Challenge;
  // Kept only while the code step is open, to send a new code.
  credentials: Credentials;
}

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signOutReason } = useAppSelector(state => state.auth);
  const [pending, setPending] = useState<Pending | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/kyc';
  if (status === 'signedIn') {
    return <Navigate to={from} replace />;
  }
  const notice = signOutReason ? REASON_MESSAGES[signOutReason] : null;

  return (
    <Center mih="100vh" p="md">
      <Stack w="100%" maw={380} gap="lg">
        <BrandMark />
        <Paper p="xl" radius="md">
          <Stack gap="lg">
            <div>
              <Title order={3} fz="h4">
                {pending ? 'Check your phone' : 'Sign in'}
              </Title>
              <Text c="dimmed" fz="sm" mt={4}>
                {pending
                  ? 'One more step to confirm it’s you.'
                  : 'For Dhan Setu administrators only.'}
              </Text>
            </div>
            {notice && !pending && <Alert color="gray">{notice}</Alert>}
            {pending ? (
              <CodeStep
                key={pending.challenge.challenge_token}
                challenge={pending.challenge}
                credentials={pending.credentials}
                onNewChallenge={challenge => setPending({ ...pending, challenge })}
                onBack={() => setPending(null)}
                onVerified={() => navigate(from, { replace: true })}
              />
            ) : (
              <CredentialsStep
                onChallenge={(challenge, credentials) => setPending({ challenge, credentials })}
              />
            )}
          </Stack>
        </Paper>
        <Text c="dimmed" fz="xs" ta="center">
          Access is monitored and recorded.
        </Text>
      </Stack>
    </Center>
  );
}
