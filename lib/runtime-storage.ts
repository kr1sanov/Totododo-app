const memoryStorage = new Map<string, string>()

function createMemoryStorage() {
  return {
    getItem(key: string) {
      return memoryStorage.get(key) ?? null
    },
    setItem(key: string, value: string) {
      memoryStorage.set(key, value)
    },
    removeItem(key: string) {
      memoryStorage.delete(key)
    },
    clear() {
      memoryStorage.clear()
    },
  } as Storage
}

export function ensureLocalStorage() {
  if (typeof globalThis === "undefined") {
    return null
  }

  const current = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage
  if (
    current &&
    typeof current.getItem === "function" &&
    typeof current.setItem === "function" &&
    typeof current.removeItem === "function"
  ) {
    return current
  }

  const fallback = createMemoryStorage()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    enumerable: true,
    value: fallback,
    writable: true,
  })
  return fallback
}

ensureLocalStorage()
