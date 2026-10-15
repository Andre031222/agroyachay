import { useSyncExternalStore } from "react";

export interface StoredValue<T extends string> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
  fallback: T;
}

export function createStoredValue<T extends string>(key: string, fallback: T, allowed: readonly T[]): StoredValue<T> {
  const listeners = new Set<() => void>();
  const read = (): T => {
    try {
      const value = window.localStorage.getItem(key);
      return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    fallback,
    get: read,
    set(value: T) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        return;
      } finally {
        listeners.forEach((listener) => listener());
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export function useStoredValue<T extends string>(store: StoredValue<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}
