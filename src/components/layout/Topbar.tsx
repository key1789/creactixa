import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { getActivityLogs, type ActivityLogItem } from '../../services/activityLogService'

const NOTIFICATION_LIMIT = 12

function toNotificationText(log: ActivityLogItem): string {
  const normalized = log.action.replaceAll('.', ' ')
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export function Topbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ActivityLogItem[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [lastSeenTick, setLastSeenTick] = useState(0)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored =
      window.localStorage.getItem('CREACTIXA_THEME') ??
      window.localStorage.getItem('creaticxa-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const notificationsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!notificationsRef.current) return
      if (!notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }

    window.addEventListener('mousedown', onClickOutside)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('keydown', onEscape)
    }
  }, [])

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      window.localStorage.setItem('CREACTIXA_THEME', next ? 'dark' : 'light')
      return next
    })
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const notificationLastSeenKey = `CREACTIXA_NOTIF_LAST_SEEN_${user?.id ?? 'anonymous'}`

  function markAllAsRead() {
    const latest = notifications[0]?.created_at ?? new Date().toISOString()
    window.localStorage.setItem(notificationLastSeenKey, latest)
    setLastSeenTick((prev) => prev + 1)
  }

  async function loadNotifications() {
    setLoadingNotifications(true)
    setNotificationsError(null)
    try {
      const logs = await getActivityLogs(NOTIFICATION_LIMIT)
      setNotifications(logs)
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Gagal memuat notifikasi.')
    } finally {
      setLoadingNotifications(false)
    }
  }

  async function toggleNotifications() {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    if (nextOpen) {
      await loadNotifications()
      markAllAsRead()
    }
  }

  function openCommandPalette() {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  const unreadCount = (() => {
    void lastSeenTick
    const lastSeenAt = window.localStorage.getItem(notificationLastSeenKey) ?? ''
    if (!lastSeenAt) return notifications.length
    const lastSeenTime = new Date(lastSeenAt).getTime()
    return notifications.filter((item) => new Date(item.created_at).getTime() > lastSeenTime).length
  })()

  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Selamat datang</p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">CREACTIXA Hub</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user?.email ?? 'Belum ada user aktif'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => void toggleNotifications()}
              className="app-button-secondary relative px-3 py-1.5"
              aria-label="Buka pusat notifikasi"
              aria-expanded={notificationsOpen}
            >
              Notifikasi
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[340px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between px-2 py-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Pusat Notifikasi
                  </p>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Tandai semua dibaca
                  </button>
                </div>

                {loadingNotifications ? (
                  <div className="rounded-lg px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Memuat notifikasi...
                  </div>
                ) : notificationsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {notificationsError}
                  </div>
                ) : notifications.length ? (
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {toNotificationText(item)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {item.actor_email ?? 'Sistem'} - {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Belum ada notifikasi.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={openCommandPalette}
            className="app-button-secondary hidden px-3 py-1.5 md:inline-flex"
            aria-label="Buka command palette"
            title="Buka command palette (Ctrl/Cmd + K)"
          >
            Cari
            <span className="ml-2 rounded-md border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Ctrl K
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="app-button-secondary px-3 py-1.5"
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            aria-pressed={isDark}
          >
            {isDark ? 'Terang' : 'Gelap'}
          </button>
          <button onClick={() => void handleSignOut()} className="app-button-secondary px-3 py-1.5">
            Keluar
          </button>
          <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:block">
            {today}
          </div>
        </div>
      </div>
    </header>
  )
}
