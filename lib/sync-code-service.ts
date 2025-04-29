import { getFromStorage, saveToStorage, isClient } from "./storage-utils"

// Интерфейс для хранения данных синхронизации
interface SyncData {
  code: string
  projects: any[]
  events: any[]
  archive: any[]
  trash: any[]
  lastUpdated: string
}

// Хранилище кодов синхронизации
const syncStorage: Record<string, SyncData> = {}

// Генерация нового кода синхронизации
export function generateSyncCode(): string {
  if (!isClient) return ""

  // Генерируем короткий код из 6 символов
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Сохраняем данные из localStorage
  const projects = getFromStorage("totododo-projects", [])
  const events = getFromStorage("totododo-events", [])
  const archive = getFromStorage("totododo-archive", [])
  const trash = getFromStorage("totododo-trash", [])

  // Создаем запись в хранилище
  syncStorage[code] = {
    code,
    projects,
    events,
    archive,
    trash,
    lastUpdated: new Date().toISOString(),
  }

  // Сохраняем код в localStorage для текущего устройства
  saveToStorage("totododo-sync-code", code)

  return code
}

// Синхронизация данных по коду
export function syncWithCode(code: string): boolean {
  if (!isClient) return false

  // Проверяем существование кода
  if (!syncStorage[code]) {
    return false
  }

  // Получаем данные по коду
  const syncData = syncStorage[code]

  // Сохраняем данные в localStorage
  saveToStorage("totododo-projects", syncData.projects)
  saveToStorage("totododo-events", syncData.events)
  saveToStorage("totododo-archive", syncData.archive)
  saveToStorage("totododo-trash", syncData.trash)

  // Сохраняем код в localStorage для текущего устройства
  saveToStorage("totododo-sync-code", code)

  return true
}

// Обновление данных для существующего кода
export function updateSyncData(code: string): boolean {
  if (!isClient) return false

  // Проверяем существование кода
  if (!syncStorage[code]) {
    return false
  }

  // Получаем актуальные данные из localStorage
  const projects = getFromStorage("totododo-projects", [])
  const events = getFromStorage("totododo-events", [])
  const archive = getFromStorage("totododo-archive", [])
  const trash = getFromStorage("totododo-trash", [])

  // Обновляем данные в хранилище
  syncStorage[code] = {
    code,
    projects,
    events,
    archive,
    trash,
    lastUpdated: new Date().toISOString(),
  }

  return true
}

// Получение текущего кода синхронизации
export function getCurrentSyncCode(): string | null {
  if (!isClient) return null

  return localStorage.getItem("totododo-sync-code")
}

// Проверка наличия обновлений
export function checkForUpdates(code: string): boolean {
  if (!isClient) return false

  // Проверяем существование кода
  if (!syncStorage[code]) {
    return false
  }

  // Получаем время последнего обновления из localStorage
  const lastLocalUpdate = localStorage.getItem("totododo-last-update")

  // Если локальных обновлений нет или они старее, чем в хранилище
  if (!lastLocalUpdate || new Date(lastLocalUpdate) < new Date(syncStorage[code].lastUpdated)) {
    return true
  }

  return false
}

// Установка времени последнего обновления
export function setLastUpdateTime(): void {
  if (!isClient) return

  saveToStorage("totododo-last-update", new Date().toISOString())
}
