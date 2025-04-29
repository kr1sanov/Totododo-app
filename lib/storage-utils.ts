// Проверка, выполняется ли код на клиенте
export const isClient = typeof window !== "undefined"

// Безопасное получение данных из localStorage
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isClient) {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Ошибка при получении ${key} из localStorage:`, error)
    return defaultValue
  }
}

// Безопасное сохранение данных в localStorage
export function saveToStorage(key: string, value: any): void {
  if (!isClient) {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Ошибка при сохранении ${key} в localStorage:`, error)
  }
}

// Безопасное удаление данных из localStorage
export function removeFromStorage(key: string): void {
  if (!isClient) {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Ошибка при удалении ${key} из localStorage:`, error)
  }
}
