import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced early so a missing .env is obvious rather than failing deep in an auth call.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to .env (see .env.example).'
  );
}

// During Expo Router's SSR pre-pass (Node.js, "output":"static"), window is undefined.
// AsyncStorage's web implementation accesses window.localStorage synchronously inside
// Promise constructors, crashing the render before any component mounts.
// The no-op adapter lets createClient initialise safely in that context; on device and
// in the real browser the real AsyncStorage is used so sessions persist normally.
const authStorage =
  typeof window === 'undefined'
    ? {
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
      }
    : AsyncStorage;

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
