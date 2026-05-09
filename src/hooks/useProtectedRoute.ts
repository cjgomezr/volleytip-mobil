import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '../store';

export function useProtectedRoute() {
  const segments        = useSegments();
  const router          = useRouter();
  const navigationState = useRootNavigationState();
  const session         = useAuthStore((s) => s.session);
  const initialized     = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!navigationState?.key || !initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, navigationState?.key, initialized]);
}
