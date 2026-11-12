import { useIdle } from '@mantine/hooks';
import { useEffect } from 'react';

import { IDLE_SIGN_OUT_MS } from '../config/env';
import { signOut, useAppDispatch } from '../store';

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'wheel',
];

/** Signs out after IDLE_SIGN_OUT_MS without input, so an unattended screen doesn't
 * stay signed in. */
export function useIdleSignOut(timeoutMs: number = IDLE_SIGN_OUT_MS): void {
  const dispatch = useAppDispatch();
  const idle = useIdle(timeoutMs, { events: ACTIVITY_EVENTS, initialState: false });
  useEffect(() => {
    if (idle) {
      void dispatch(signOut('idle'));
    }
  }, [idle, dispatch]);
}
