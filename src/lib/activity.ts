import AsyncStorage from '@react-native-async-storage/async-storage';

const DATES_KEY = '@volleytip/activity_dates';

function todayISO(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function recordActivityDate(): Promise<void> {
  try {
    const today = todayISO();
    const raw = await AsyncStorage.getItem(DATES_KEY);
    const dates: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!dates.includes(today)) {
      dates.push(today);
      await AsyncStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }
  } catch {
    // ignore — non-critical
  }
}

export async function getActivityDates(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DATES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const unique = [...new Set(dates)].sort().reverse(); // newest first

  const today = todayISO();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  // Racha activa solo si el último día de actividad fue hoy o ayer
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const newer = new Date(unique[i - 1]).getTime();
    const older = new Date(unique[i]).getTime();
    const diffDays = (newer - older) / 86_400_000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
