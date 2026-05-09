import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface HomeStats {
  sessions: number;
  saved: number;
}

export function useHomeStats(): HomeStats {
  const [stats, setStats] = useState<HomeStats>({ sessions: 0, saved: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [allKeys, routinesRaw] = await Promise.all([
          AsyncStorage.getAllKeys(),
          AsyncStorage.getItem('@volleytip/my_routines'),
        ]);

        const sessions = allKeys.filter((k) =>
          k.startsWith('@volleytip/day_done_'),
        ).length;

        let saved = 0;
        if (routinesRaw) {
          const parsed: unknown = JSON.parse(routinesRaw);
          saved = Array.isArray(parsed) ? parsed.length : 0;
        }

        setStats({ sessions, saved });
      } catch {
        // keep defaults on error
      }
    }
    load();
  }, []);

  return stats;
}
