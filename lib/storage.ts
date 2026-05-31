import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Meal {
  text: string;
  time?: string;
}

export interface DayData {
  sleep: string;
  moveMin: string;
  moveNote: string;
  meals: Meal[];
  water: number;
  sugarFree: boolean;
  shampoo: boolean;
  microneedle: boolean;
  weight: string;
  energy: number;
  notes: string;
}

export const DEFAULT_DAY: DayData = {
  sleep: '',
  moveMin: '',
  moveNote: '',
  meals: [],
  water: 0,
  sugarFree: false,
  shampoo: false,
  microneedle: false,
  weight: '',
  energy: 0,
  notes: '',
};

const PREFIX = 'daily-log:day:';

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getDay(dateKey: string): Promise<DayData> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + dateKey);
    if (!raw) return { ...DEFAULT_DAY };
    return { ...DEFAULT_DAY, ...(JSON.parse(raw) as Partial<DayData>) };
  } catch {
    return { ...DEFAULT_DAY };
  }
}

export async function saveDay(dateKey: string, data: DayData): Promise<void> {
  await AsyncStorage.setItem(PREFIX + dateKey, JSON.stringify(data));
}
