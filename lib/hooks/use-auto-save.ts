'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './use-debounce';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** Data to auto-save */
  data: T;
  /** Async function that persists the data. Should throw on failure. */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms (default 1500) */
  delay?: number;
  /** Whether auto-save is enabled (default true) */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  /** Trigger an immediate save (bypasses debounce) */
  saveNow: () => Promise<void>;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const dataRef = useRef(data);
  dataRef.current = data;
  const initialDataRef = useRef<string>(JSON.stringify(data));
  const isFirstRender = useRef(true);

  // Reset "saved" status back to "idle" after 3s
  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const performSave = useCallback(async () => {
    // Skip saving if data hasn't changed from initial load
    if (JSON.stringify(dataRef.current) === initialDataRef.current) return;

    setStatus('saving');
    try {
      await onSaveRef.current(dataRef.current);
      setLastSavedAt(new Date());
      setStatus('saved');
      // Update the reference so subsequent no-change checks work
      initialDataRef.current = JSON.stringify(dataRef.current);
    } catch {
      setStatus('error');
    }
  }, []);

  // Serialize data for debounce dependency
  const serialized = JSON.stringify(data);

  useDebounce(
    () => {
      if (!enabled) return;
      // Don't save on initial render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      performSave();
    },
    delay,
    [serialized]
  );

  return { status, lastSavedAt, saveNow: performSave };
}
