import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Meal {
  id: string;
  text: string;
  protein: boolean;
  ironRich: boolean;
  omega3: boolean;
  vegFruit: boolean;
}

export const DEFAULT_MEAL: Meal = {
  id: '',
  text: '',
  protein: false,
  ironRich: false,
  omega3: false,
  vegFruit: false,
};

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

// ─── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  sugarStart: string | null;
  focusStart: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  sugarStart: null,
  focusStart: null,
};

const SETTINGS_KEY = 'daily-log:settings';

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Day data ─────────────────────────────────────────────────────────────────

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
    const parsed = JSON.parse(raw) as Partial<DayData>;
    // Forward-compat: ensure every meal has the full shape (handles saves from older builds)
    if (parsed.meals) {
      parsed.meals = parsed.meals.map((m, i) => ({
        ...DEFAULT_MEAL,
        ...(m as object),
        id: (m as Meal).id || `${dateKey}-${i}`,
      }));
    }
    return { ...DEFAULT_DAY, ...parsed };
  } catch {
    return { ...DEFAULT_DAY };
  }
}

export async function saveDay(dateKey: string, data: DayData): Promise<void> {
  await AsyncStorage.setItem(PREFIX + dateKey, JSON.stringify(data));
}
