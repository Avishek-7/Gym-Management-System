type StorageListener<T> = (value: T | null) => void;

export interface LocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  syncTabs?: boolean;
  onError?: (error: unknown) => void;
}

export interface LocalStorageResource<T> {
  get(): T | null;
  set(value: T): void;
  update(updater: (current: T | null) => T): void;
  remove(): void;
  subscribe(listener: StorageListener<T>): () => void;
}

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function safeExecute<T>(fn: () => T, onError?: (error: unknown) => void): T | null {
  try {
    return fn();
  } catch (error) {
    onError?.(error);
    return null;
  }
}

export function createLocalStorageResource<T>(
  key: string,
  options: LocalStorageOptions<T> = {}
): LocalStorageResource<T> {
  const {
    serializer = (value: T) => JSON.stringify(value),
    deserializer = (value: string) => JSON.parse(value) as T,
    syncTabs = true,
    onError,
  } = options;

  const listeners = new Set<StorageListener<T>>();

  const notify = (value: T | null) => {
    listeners.forEach((listener) => listener(value));
  };

  const read = (): T | null => {
    if (!isBrowser) return null;

    const raw = safeExecute(() => window.localStorage.getItem(key), onError);
    if (raw === null || raw === undefined) return null;

    return safeExecute(() => deserializer(raw), onError);
  };

  const write = (value: T) => {
    if (!isBrowser) return;

    const stringValue = safeExecute(() => serializer(value), onError);
    if (stringValue === null) return;

    safeExecute(() => window.localStorage.setItem(key, stringValue), onError);
    notify(value);
  };

  const removeValue = () => {
    if (!isBrowser) return;

    safeExecute(() => window.localStorage.removeItem(key), onError);
    notify(null);
  };

  let storageHandler: ((event: StorageEvent) => void) | null = null;

  const subscribe = (listener: StorageListener<T>) => {
    listeners.add(listener);

    // Attach storage event handler if syncTabs is enabled and not already attached
    if (isBrowser && syncTabs && !storageHandler) {
      storageHandler = (event: StorageEvent) => {
        if (event.key !== key) return;
        const nextValue = event.newValue === null ? null : safeExecute(() => deserializer(event.newValue!), onError);
        notify(nextValue);
      };
      window.addEventListener("storage", storageHandler);
    }

    // Unsubscribe function
    return () => {
      listeners.delete(listener);
      // Remove storage event handler if no listeners left
      if (isBrowser && syncTabs && listeners.size === 0 && storageHandler) {
        window.removeEventListener("storage", storageHandler);
        storageHandler = null;
      }
    };
  };

  return {
    get: read,
    set: write,
    update: (updater) => {
      const nextValue = updater(read());
      write(nextValue);
    },
    remove: removeValue,
    subscribe,
  };
}