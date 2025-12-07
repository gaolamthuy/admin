import type { SupabaseClient, Session } from '@supabase/supabase-js';

export interface SessionWatcherOptions {
  refreshThresholdMs?: number;
  checkIntervalMs?: number;
}

let watcherCleanup: (() => void) | null = null;

const shouldRefreshSession = (session: Session | null, thresholdMs: number) => {
  if (!session?.expires_at) {
    return true;
  }
  const expiresAtMs = session.expires_at * 1000;
  const timeUntilExpiry = expiresAtMs - Date.now();
  return timeUntilExpiry <= thresholdMs;
};

export const ensureSessionActive = async (
  client: SupabaseClient,
  refreshThresholdMs = 60_000
): Promise<void> => {
  const { data, error } = await client.auth.getSession();

  if (error || shouldRefreshSession(data.session, refreshThresholdMs)) {
    await client.auth.refreshSession();
  }
};

export const startSupabaseSessionWatcher = (
  client: SupabaseClient,
  options: SessionWatcherOptions = {}
) => {
  const threshold = options.refreshThresholdMs ?? 60_000;
  const interval = options.checkIntervalMs ?? 30_000;

  if (watcherCleanup) {
    return watcherCleanup;
  }

  let stopped = false;

  const checkSession = async () => {
    if (stopped) return;
    try {
      await ensureSessionActive(client, threshold);
    } catch (error) {
      console.warn('[session-watcher] ensureSessionActive failed:', error);
    }
  };

  const intervalId = setInterval(checkSession, interval);
  checkSession();

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(() => {
    checkSession();
  });

  watcherCleanup = () => {
    stopped = true;
    clearInterval(intervalId);
    subscription.unsubscribe();
    watcherCleanup = null;
  };

  return watcherCleanup;
};
