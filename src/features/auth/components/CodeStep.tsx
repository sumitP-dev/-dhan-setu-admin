import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Anchor, Button, Group, PinInput, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { env } from '../../../config/env';
import { useLogin, useVerifyCode } from '../hooks';
import { codeSchema, type Challenge, type CodeForm, type Credentials } from '../schemas';

interface Props {
  challenge: Challenge;
  credentials: Credentials;
  onNewChallenge: (challenge: Challenge) => void;
  onBack: () => void;
  onVerified: () => void;
}

/** Seconds left until `seconds` from the first render. */
function useCountdown(seconds: number) {
  const [deadline] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(Math.ceil((deadline - now) / 1000), 0);
}

export function CodeStep({ challenge, credentials, onNewChallenge, onBack, onVerified }: Props) {
  const verify = useVerifyCode();
  const resend = useLogin();
  const resendIn = useCountdown(challenge.resend_after);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } });

  const submit = handleSubmit(({ code }) =>
    verify.mutate(
      { challengeToken: challenge.challenge_token, code },
      { onSuccess: onVerified, onError: () => reset({ code: '' }) },
    ),
  );

  const sendAgain = () =>
    // The parent remounts this step for the new challenge (fresh form and countdown).
    resend.mutate(credentials, { onSuccess: onNewChallenge });

  const error = verify.error ?? resend.error;

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <Text fz="sm" c="dimmed">
          Enter the 6-digit code sent to{' '}
          <Text
            span
            inherit
            fw={500}
            c="var(--mantine-color-text)"
            style={{ whiteSpace: 'nowrap' }}
          >
            {challenge.phone_hint}
          </Text>
          .
        </Text>
        {error && (
          <Alert color="red" role="alert">
            {error.message}
          </Alert>
        )}
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <PinInput
              length={6}
              type="number"
              oneTimeCode
              autoFocus
              aria-label="Verification code"
              value={field.value}
              onChange={field.onChange}
              onComplete={() => void submit()}
              error={Boolean(errors.code)}
              disabled={verify.isPending}
            />
          )}
        />
        {errors.code && (
          <Text c="red" fz="xs" mt={-8}>
            {errors.code.message}
          </Text>
        )}
        {env.isDev && challenge.dev_otp && (
          <Text fz="xs" c="dimmed">
            Development code: {challenge.dev_otp}
          </Text>
        )}
        <Button type="submit" fullWidth loading={verify.isPending}>
          Verify and sign in
        </Button>
        <Group justify="space-between">
          <Anchor component="button" type="button" fz="sm" c="dimmed" onClick={onBack}>
            Use a different account
          </Anchor>
          <Anchor
            component="button"
            type="button"
            fz="sm"
            onClick={sendAgain}
            disabled={resendIn > 0 || resend.isPending}
            c={resendIn > 0 ? 'dimmed' : undefined}
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </Anchor>
        </Group>
      </Stack>
    </form>
  );
}
