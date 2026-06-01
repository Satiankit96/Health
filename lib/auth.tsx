import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { migrateLocalToCloud } from '@/lib/storage';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Tracks which user we've already kicked off migration for, so it runs at most
  // once per signed-in user per app launch (the persisted flag handles cross-launch).
  const migratedFor = useRef<string | null>(null);

  function maybeMigrate(next: Session | null) {
    const userId = next?.user?.id ?? null;
    if (userId && migratedFor.current !== userId) {
      migratedFor.current = userId;
      // Fire-and-forget; migrateLocalToCloud never throws and is idempotent.
      migrateLocalToCloud(userId);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Initial session read from persisted storage.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      maybeMigrate(data.session);
    });

    // Keep in sync with sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      maybeMigrate(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
