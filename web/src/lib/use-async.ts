"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (updater: (current: T | undefined) => T | undefined) => void;
}

interface Result<T> {
  key: string;
  data?: T;
  error?: unknown;
}

const cache = new Map<string, unknown>();

export function clearCache() {
  cache.clear();
}

export function useAsync<T>(loader: (() => Promise<T>) | null, deps: readonly unknown[], cacheKey?: string): AsyncState<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const enabled = loader !== null;
  const key = `${JSON.stringify(deps)}#${nonce}#${enabled}`;
  const run = useEffectEvent(() => (loader ? loader() : null));

  useEffect(() => {
    const promise = run();
    if (!promise) return;
    let cancelled = false;
    promise.then(
      (data) => {
        if (cacheKey) cache.set(cacheKey, data);
        if (!cancelled) setResult({ key, data });
      },
      (error: unknown) => {
        if (!cancelled) setResult({ key, error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, cacheKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (updater: (current: T | undefined) => T | undefined) => {
      setResult((previous) => {
        if (!previous) return previous;
        const data = updater(previous.data);
        if (cacheKey) cache.set(cacheKey, data);
        return { ...previous, data, error: undefined };
      });
    },
    [cacheKey],
  );

  const current = result && result.key === key ? result : null;
  const stale = result?.error === undefined ? result?.data : undefined;
  const cached = cacheKey && cache.has(cacheKey) ? (cache.get(cacheKey) as T) : undefined;
  return {
    data: current?.data ?? stale ?? cached,
    error: current?.error,
    loading: enabled && !current,
    reload,
    setData,
  };
}
