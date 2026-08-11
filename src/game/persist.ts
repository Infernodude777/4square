// ─────────────────────────────────────────────────────────────
//  DEBOUNCED PERSISTENCE
//
//  Gameplay fires a LOT of tiny store updates (every rally bumps
//  lifetime stats, every hit bumps counters). Zustand's persist
//  middleware JSON.stringifies + writes the whole slice to
//  localStorage on EVERY set() — that's per-frame churn during a
//  heated rally. This storage wrapper batches writes with a short
//  trailing debounce and flushes synchronously on page hide/unload
//  so nothing is lost when the player closes the tab.
// ─────────────────────────────────────────────────────────────

import type { PersistStorage, StorageValue } from "zustand/middleware";

export function createDebouncedStorage<S>(ms = 250): PersistStorage<S> {
  const pending = new Map<string, StorageValue<S>>();
  let timer: number | null = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.size === 0) return;
    pending.forEach((value, key) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Quota / private-mode errors must never crash the game loop.
      }
    });
    pending.clear();
  };

  // Guard for test environments where `window` is a bare shim.
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    // Give the last debounce a chance to land even if the tab lingers.
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending.set(name, value);
      if (timer === null) timer = window.setTimeout(flush, ms);
    },
    removeItem: (name) => {
      pending.delete(name);
      localStorage.removeItem(name);
    },
  };
}
