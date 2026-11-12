import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '../../api/errors';
import { signOut, startSession, useAppDispatch, type SignOutReason } from '../../store';
import * as authApi from './api';
import type { AdminSession, Challenge, Credentials } from './schemas';

export function useLogin() {
  return useMutation<Challenge, ApiError, Credentials>({
    mutationFn: credentials => authApi.login(credentials),
  });
}

export function useVerifyCode() {
  const dispatch = useAppDispatch();
  return useMutation<AdminSession, ApiError, { challengeToken: string; code: string }>({
    mutationFn: ({ challengeToken, code }) => authApi.verifyCode(challengeToken, code),
    onSuccess: async session => {
      await dispatch(startSession(session)).unwrap();
    },
  });
}

export function useSignOut() {
  const dispatch = useAppDispatch();
  return (reason: SignOutReason = 'signed_out') => dispatch(signOut(reason));
}
