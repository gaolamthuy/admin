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

/**
 * Đảm bảo Supabase session còn active và connection được restore
 * @param client - Supabase client instance
 * @param refreshThresholdMs - Threshold để refresh session (default: 60s)
 * @returns Promise<void>
 */
export const ensureSessionActive = async (
  client: SupabaseClient,
  refreshThresholdMs = 60_000
): Promise<void> => {
  try {
    // Lấy session hiện tại
    const { data, error } = await client.auth.getSession();

    // Nếu có lỗi hoặc session sắp hết hạn, refresh session
    if (error || shouldRefreshSession(data.session, refreshThresholdMs)) {
      const refreshResult = await client.auth.refreshSession();

      // Nếu refresh thất bại, throw error để caller có thể handle
      if (refreshResult.error) {
        throw new Error(
          `Failed to refresh session: ${refreshResult.error.message}`
        );
      }
    }

    // Verify connection bằng cách check session user
    // Điều này đảm bảo connection được restore sau khi tab inactive
    // Không dùng test query vì có thể bị RLS block và không phản ánh đúng connection state
    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError) {
      console.warn(
        '[session-watcher] Failed to get user after session refresh:',
        userError.message
      );
      // Không throw vì có thể là temporary network issue
    } else if (!userData.user) {
      console.warn('[session-watcher] No user found after session refresh');
    }
  } catch (error) {
    console.error('[session-watcher] ensureSessionActive error:', error);
    throw error;
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
