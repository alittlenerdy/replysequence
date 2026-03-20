/**
 * Token Refresh Lock
 *
 * Prevents concurrent OAuth token refreshes for the same user+provider.
 * When multiple requests try to refresh simultaneously, only the first
 * one executes the actual refresh; all others await the same promise.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refreshLocks = new Map<string, Promise<any>>();

/**
 * Execute a token refresh with deduplication.
 *
 * @param key - Unique key for the lock (e.g. `${userId}:${provider}`)
 * @param refreshFn - The actual refresh function to execute
 * @returns The result of the refresh function
 *
 * If a refresh is already in progress for the given key, the existing
 * promise is returned instead of starting a new refresh. When the refresh
 * completes (success or failure), the lock is removed so future calls
 * can start a fresh refresh.
 */
export async function withTokenRefreshLock<T>(
  key: string,
  refreshFn: () => Promise<T>
): Promise<T> {
  const existing = refreshLocks.get(key);
  if (existing) return existing as Promise<T>;

  const promise = refreshFn().finally(() => {
    refreshLocks.delete(key);
  });

  refreshLocks.set(key, promise);
  return promise;
}
