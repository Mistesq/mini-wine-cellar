import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mini-wine-cellar:user-id";

const listeners = new Set<() => void>();

// Holds the choice when localStorage refuses the write (blocked storage in
// privacy modes or sandboxed iframes, a full quota), so the picker still works
// until reload.
let fallbackUserId: string | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function onStorage(event: StorageEvent) {
  // A null key means localStorage.clear() in another tab.
  if (event.key === null || event.key === STORAGE_KEY) {
    notify();
  }
}

// Fires only on a real change (this tab or another tab), never on hydration,
// so it is safe to clear the Apollo store from a listener.
export function subscribeToCurrentUser(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getCurrentUserId(): string | null {
  if (fallbackUserId !== null) {
    return fallbackUserId;
  }
  // Even reading window.localStorage throws when storage is blocked, and there
  // is no window at all on the server; both mean "no user chosen".
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentUserId(userId: string): void {
  if (userId === getCurrentUserId()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, userId);
    fallbackUserId = null;
  } catch {
    fallbackUserId = userId;
  }
  notify();
}

function getServerSnapshot(): null {
  return null;
}

export function useCurrentUserId(): string | null {
  return useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserId,
    getServerSnapshot,
  );
}
