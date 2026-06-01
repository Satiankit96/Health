import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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

export interface Settings {
  sugarStart: string | null;
  focusStart: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  sugarStart: null,
  focusStart: null,
};

export interface DayEntry {
  dateKey: string;
  data: DayData;
}

const PREFIX = 'daily-log:day:';
const SETTINGS_KEY = 'daily-log:settings';
const MIGRATED_PREFIX = 'daily-log:migrated:';

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Internal: shape normalisation ──────────────────────────────────────────────
// Merge stored/remote data over defaults and backfill missing meal fields, so saves
// from older builds (or partial remote rows) never break. (See AGENTS.md.)
function normalizeDay(parsed: Partial<DayData>, dateKey: string): DayData {
  let next: Partial<DayData> = parsed;
  if (parsed.meals) {
    next = {
      ...parsed,
      meals: parsed.meals.map((m, i) => ({
        ...DEFAULT_MEAL,
        ...(m as object),
        id: (m as Meal).id || `${dateKey}-${i}`,
      })),
    };
  }
  return { ...DEFAULT_DAY, ...next };
}

// ─── Internal: current user ─────────────────────────────────────────────────────
// getSession reads from the persisted auth store (offline-safe, no network).
// Returns null when signed out → callers fall back to local-only behaviour.
async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Internal: local cache (AsyncStorage) ───────────────────────────────────────
async function readLocalDay(dateKey: string): Promise<DayData> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + dateKey);
    if (!raw) return { ...DEFAULT_DAY };
    return normalizeDay(JSON.parse(raw) as Partial<DayData>, dateKey);
  } catch {
    return { ...DEFAULT_DAY };
  }
}

async function writeLocalDay(dateKey: string, data: DayData): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + dateKey, JSON.stringify(data));
  } catch {
    // Cache write failure is non-fatal.
  }
}

async function readLocalRange(dateKeys: string[]): Promise<DayEntry[]> {
  const storageKeys = dateKeys.map((k) => PREFIX + k);
  try {
    const pairs = await AsyncStorage.multiGet(storageKeys);
    return pairs.map(([, raw], i) => {
      const dateKey = dateKeys[i];
      if (!raw) return { dateKey, data: { ...DEFAULT_DAY } };
      try {
        return { dateKey, data: normalizeDay(JSON.parse(raw) as Partial<DayData>, dateKey) };
      } catch {
        return { dateKey, data: { ...DEFAULT_DAY } };
      }
    });
  } catch {
    return dateKeys.map((dateKey) => ({ dateKey, data: { ...DEFAULT_DAY } }));
  }
}

async function readLocalSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeLocalSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Cache write failure is non-fatal.
  }
}

// ─── Day data ─────────────────────────────────────────────────────────────────

export async function getDay(dateKey: string): Promise<DayData> {
  const userId = await getUserId();
  if (!userId) return readLocalDay(dateKey);

  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('data')
      .eq('user_id', userId)
      .eq('date', dateKey)
      .maybeSingle();
    if (error) throw error;

    // No remote row yet → prefer local cache (may hold a local-only entry).
    if (!data) return readLocalDay(dateKey);

    const day = normalizeDay((data.data ?? {}) as Partial<DayData>, dateKey);
    await writeLocalDay(dateKey, day); // refresh cache
    return day;
  } catch {
    return readLocalDay(dateKey); // network/error → cached value, never throw
  }
}

export async function saveDay(dateKey: string, data: DayData): Promise<void> {
  // Cache first so the UI is durable even if the network call fails.
  await writeLocalDay(dateKey, data);

  const userId = await getUserId();
  if (!userId) return; // local-only when signed out

  try {
    await supabase.from('daily_logs').upsert(
      {
        user_id: userId,
        date: dateKey,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    );
  } catch {
    // Swallow — cache already holds the write; retry/queue is Phase 5.
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const userId = await getUserId();
  if (!userId) return readLocalSettings();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('sugar_start, focus_start')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    if (!data) return readLocalSettings();

    const settings: Settings = {
      sugarStart: data.sugar_start ?? null,
      focusStart: data.focus_start ?? null,
    };
    await writeLocalSettings(settings); // refresh cache
    return settings;
  } catch {
    return readLocalSettings();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeLocalSettings(settings);

  const userId = await getUserId();
  if (!userId) return;

  try {
    await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        sugar_start: settings.sugarStart,
        focus_start: settings.focusStart,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // Swallow — cache holds the write.
  }
}

// ─── Range loader ─────────────────────────────────────────────────────────────

export async function getRecentDays(n: number): Promise<DayEntry[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateKeys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateKeys.push(toDateKey(d));
  }

  const userId = await getUserId();
  if (!userId) return readLocalRange(dateKeys);

  try {
    const startKey = dateKeys[0];
    const endKey = dateKeys[dateKeys.length - 1];
    const { data, error } = await supabase
      .from('daily_logs')
      .select('date, data')
      .eq('user_id', userId)
      .gte('date', startKey)
      .lte('date', endKey);
    if (error) throw error;

    const byDate = new Map<string, DayData>();
    for (const row of data ?? []) {
      const dk = String(row.date);
      byDate.set(dk, normalizeDay((row.data ?? {}) as Partial<DayData>, dk));
    }

    // Start from local cache (preserves any local-only days), then overlay remote.
    const local = await readLocalRange(dateKeys);
    const merged: DayEntry[] = local.map((entry) =>
      byDate.has(entry.dateKey)
        ? { dateKey: entry.dateKey, data: byDate.get(entry.dateKey)! }
        : entry
    );

    // Refresh cache for the days that came from remote.
    await Promise.all(
      merged
        .filter((e) => byDate.has(e.dateKey))
        .map((e) => writeLocalDay(e.dateKey, e.data))
    );

    return merged;
  } catch {
    return readLocalRange(dateKeys);
  }
}

// ─── One-time migration: local → cloud ──────────────────────────────────────────
// On first sign-in for a given user on this device, push existing local day rows and
// settings up to Supabase. Insert-only (ignoreDuplicates) so pre-existing cloud data
// is never overwritten, and local data is only ever read — never deleted.
export async function migrateLocalToCloud(userId: string): Promise<void> {
  const flagKey = MIGRATED_PREFIX + userId;
  try {
    const already = await AsyncStorage.getItem(flagKey);
    if (already) return;

    // Day rows.
    const allKeys = await AsyncStorage.getAllKeys();
    const dayKeys = allKeys.filter((k) => k.startsWith(PREFIX));

    if (dayKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(dayKeys);
      const rows: Array<{
        user_id: string;
        date: string;
        data: DayData;
        updated_at: string;
      }> = [];
      const now = new Date().toISOString();

      for (const [storageKey, raw] of pairs) {
        if (!raw) continue;
        const dateKey = storageKey.slice(PREFIX.length);
        try {
          rows.push({
            user_id: userId,
            date: dateKey,
            data: normalizeDay(JSON.parse(raw) as Partial<DayData>, dateKey),
            updated_at: now,
          });
        } catch {
          // Skip an unparseable local row rather than abort the whole migration.
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from('daily_logs')
          .upsert(rows, { onConflict: 'user_id,date', ignoreDuplicates: true });
        if (error) throw error; // leave flag unset so we retry next sign-in
      }
    }

    // Settings (only if the user actually started a streak locally).
    const localSettings = await readLocalSettings();
    if (localSettings.sugarStart || localSettings.focusStart) {
      const { error } = await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          sugar_start: localSettings.sugarStart,
          focus_start: localSettings.focusStart,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
      if (error) throw error;
    }

    await AsyncStorage.setItem(flagKey, new Date().toISOString());
  } catch {
    // Never throw to the UI; migration retries on the next sign-in.
  }
}
