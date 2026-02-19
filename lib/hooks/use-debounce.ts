'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `callback` after `delay` ms of inactivity.
 * Resets the timer every time `deps` change.
 */
export function useDebounce(
  callback: () => void,
  delay: number,
  deps: unknown[]
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
