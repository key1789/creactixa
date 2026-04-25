import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type CommandItem = {
  id: string
  label: string
  hint: string
  path: string
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Buka Dashboard', hint: 'Ringkasan & KPI', path: '/' },
  { id: 'clients', label: 'Buka Clients', hint: 'Kelola data client', path: '/clients' },
  {
    id: 'content-planning',
    label: 'Buka Content Planning',
    hint: 'Kelola ide dan approval',
    path: '/content-planning',
  },
  { id: 'productions', label: 'Buka Productions', hint: 'Board eksekusi', path: '/productions' },
  { id: 'calendar', label: 'Buka Calendar', hint: 'Tampilan jadwal', path: '/calendar' },
  { id: 'activity-log', label: 'Buka Activity Log', hint: 'Jejak audit', path: '/activity-log' },
]

function scoreCommand(command: CommandItem, query: string): number {
  if (!query) return 1
  const q = query.toLowerCase().trim()
  const label = command.label.toLowerCase()
  const hint = command.hint.toLowerCase()
  const path = command.path.toLowerCase()

  if (label.startsWith(q)) return 100
  if (label.includes(q)) return 80
  if (hint.includes(q)) return 50
  if (path.includes(q)) return 30
  return 0
}

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = filteredIndex(activeIndex, query)

  function filteredIndex(index: number, currentQuery: string): number {
    const nextListLength = COMMANDS.map((item) => ({ item, score: scoreCommand(item, currentQuery) }))
      .filter((entry) => entry.score > 0)
      .length

    if (!nextListLength) return 0
    return Math.min(index, nextListLength - 1)
  }

  function closePalette() {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const filteredCommands = useMemo(() => {
    return COMMANDS.map((item) => ({ item, score: scoreCommand(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
  }, [query])

  useEffect(() => {
    function onOpenPalette() {
      setOpen(true)
    }

    window.addEventListener('open-command-palette', onOpenPalette as EventListener)
    return () => window.removeEventListener('open-command-palette', onOpenPalette as EventListener)
  }, [])

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) {
          closePalette()
        } else {
          setOpen(true)
        }
        return
      }

      if (!open) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closePalette()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((prev) => (filteredCommands.length ? (prev + 1) % filteredCommands.length : 0))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((prev) =>
          filteredCommands.length ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0
        )
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const target = filteredCommands[safeActiveIndex]
        if (!target) return
        navigate(target.path)
        closePalette()
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [activeIndex, filteredCommands, navigate, open, safeActiveIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/45 p-4 pt-20" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ketik perintah... (contoh: clients, calendar)"
            className="app-input border-0 bg-transparent p-0 text-base focus-visible:ring-0"
            aria-label="Cari perintah"
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {filteredCommands.length ? (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  navigate(command.path)
                  closePalette()
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                  index === safeActiveIndex
                    ? 'bg-brand-50 text-slate-900 dark:bg-brand-900/30 dark:text-slate-100'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                aria-current={index === safeActiveIndex}
              >
                <span className="text-sm font-medium">{command.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{command.hint}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Tidak ada perintah yang cocok.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>Navigasi lebih cepat dengan keyboard</span>
          <span>Ctrl/Cmd + K</span>
        </div>
      </div>
    </div>
  )
}
