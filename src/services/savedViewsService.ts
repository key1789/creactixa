export interface SavedView<TState> {
  id: string
  name: string
  state: TState
  createdAt: string
}

const STORAGE_PREFIX = 'CREACTIXA_SAVED_VIEW_'

function storageKey(pageKey: string): string {
  return `${STORAGE_PREFIX}${pageKey}`
}

function safeParse<T>(value: string | null): SavedView<T>[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as SavedView<T>[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function readSavedViews<T>(pageKey: string): SavedView<T>[] {
  if (typeof window === 'undefined') return []
  return safeParse<T>(window.localStorage.getItem(storageKey(pageKey)))
}

export function saveView<T>(pageKey: string, name: string, state: T): SavedView<T>[] {
  const nextEntry: SavedView<T> = {
    id: crypto.randomUUID(),
    name: name.trim(),
    state,
    createdAt: new Date().toISOString(),
  }
  const next = [nextEntry, ...readSavedViews<T>(pageKey)].slice(0, 10)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey(pageKey), JSON.stringify(next))
  }
  return next
}

export function removeView<T>(pageKey: string, id: string): SavedView<T>[] {
  const next = readSavedViews<T>(pageKey).filter((item) => item.id !== id)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey(pageKey), JSON.stringify(next))
  }
  return next
}
