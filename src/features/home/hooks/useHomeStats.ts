import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { calculateStreak, getActivityDates } from '../../../lib/activity';

interface HomeStats {
  sessions: number;
  streak: number;
  myRoutines: number;
}

export function useHomeStats(): HomeStats {
  const [stats, setStats] = useState<HomeStats>({
    sessions: 0,
    streak: 0,
    myRoutines: 0,
  });

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const [allKeys, routinesRaw, activityDates] = await Promise.all([
            AsyncStorage.getAllKeys(),
            AsyncStorage.getItem('@volleytip/my_routines'),
            getActivityDates(),
          ]);

          const sessions = allKeys.filter((k) =>
            k.startsWith('@volleytip/day_done_'),
          ).length;

          const streak = calculateStreak(activityDates);

          let myRoutines = 0;
          if (routinesRaw) {
            const parsed: unknown = JSON.parse(routinesRaw);
            myRoutines = Array.isArray(parsed) ? parsed.length : 0;
          }

          setStats({ sessions, streak, myRoutines });
        } catch {
          // keep defaults on error
        }
      }
      load();
    }, []),
  );

  return stats;
}
