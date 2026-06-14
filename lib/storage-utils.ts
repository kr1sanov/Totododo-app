import "./runtime-storage"

function getSafeStorage() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const storage = window.localStorage
    if (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    ) {
      return storage
    }
  } catch (error) {
    return null
  }

  return null
}

// Проверка, выполняется ли код на клиенте с рабочим localStorage
export const isClient = !!getSafeStorage()

// Безопасное получение данных из localStorage
export function getFromStorage<T>(key: string, defaultValue: T): T {
  const storage = getSafeStorage()
  if (!storage) {
    return defaultValue
  }

  try {
    const item = storage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Ошибка при получении ${key} из localStorage:`, error)
    return defaultValue
  }
}

// Безопасное сохранение данных в localStorage
export function saveToStorage(key: string, value: any): void {
  const storage = getSafeStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Ошибка при сохранении ${key} в localStorage:`, error)
  }
}

// Безопасное удаление данных из localStorage
export function removeFromStorage(key: string): void {
  const storage = getSafeStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(key)
  } catch (error) {
    console.error(`Ошибка при удалении ${key} из localStorage:`, error)
  }
}
