import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from 'react-hook-form';

import { useLogin } from '../hooks';
import { credentialsSchema, type Challenge, type Credentials } from '../schemas';

interface Props {
  onChallenge: (challenge: Challenge, credentials: Credentials) => void;
}

export function CredentialsStep({ onChallenge }: Props) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(credentials =>
    login.mutate(credentials, { onSuccess: challenge => onChallenge(challenge, credentials) }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        {login.error && (
          <Alert color="red" role="alert">
            {login.error.message}
          </Alert>
        )}
        <TextInput
          label="Email"
          type="email"
          autoComplete="username"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={login.isPending}>
          Continue
        </Button>
      </Stack>
    </form>
  );
}
