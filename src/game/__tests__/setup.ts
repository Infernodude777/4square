// Minimal localStorage shim so the zustand persist stores (achievements,
// settings) can hydrate under node. The browser uses the real thing.
// zustand v5's persist default storage reads `window.localStorage`, so the
// shim is exposed through both globals.
const backing = new Map<string, string>();

const storage = {
  getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
  setItem: (k: string, v: string) => void backing.set(k, v),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
  key: (i: number) => [...backing.keys()][i] ?? null,
  get length() {
    return backing.size;
  },
};

const g = globalThis as Record<string, unknown>;
g.localStorage = storage;
// The debounced persist storage (src/game/persist.ts) touches window's
// event listeners + timers — give the shim just enough surface to run.
g.window = {
  localStorage: storage,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
g.document = { visibilityState: "visible" as const };
