import { useEffect, useMemo, useState } from 'react'
import { ProductionDetailView } from '../features/productions/ProductionDetailView'
import { ProductionDrawer } from '../features/productions/ProductionDrawer'
import type { Production, ProductionUpdate } from '../features/productions/types'
import { getProductions, updateProduction } from '../services/productionService'

type CalendarItem = {
  type: 'take' | 'post'
  production: Production
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isSavingDrawer, setIsSavingDrawer] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showTake, setShowTake] = useState(true)
  const [showPost, setShowPost] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductions()
        setProductions(data.filter((item) => !item.clients?.is_archived))
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load calendar.')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [])

  const gridDays = useMemo(() => buildMonthGrid(currentMonth), [currentMonth])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const production of productions) {
      if (production.take_date) {
        const key = formatDateKey(parseISODateToLocal(production.take_date))
        map.set(key, [...(map.get(key) ?? []), { type: 'take', production }])
      }
      if (production.post_date) {
        const key = formatDateKey(parseISODateToLocal(production.post_date))
        map.set(key, [...(map.get(key) ?? []), { type: 'post', production }])
      }
    }
    return map
  }, [productions])

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function selectProduction(production: Production) {
    setSelectedProduction(production)
  }

  async function handleSaveDrawer(payload: ProductionUpdate) {
    if (!selectedProduction) return
    setIsSavingDrawer(true)
    setError(null)
    try {
      const updated = await updateProduction(selectedProduction.id, payload)
      setProductions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedProduction(updated)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update schedule.')
    } finally {
      setIsSavingDrawer(false)
    }
  }

  return (
    <section className="space-y-4" aria-busy={loading} aria-labelledby="calendar-page-title">
      <div className="app-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Production calendar</p>
          <h1 id="calendar-page-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Schedule Production
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Lihat take dan post date dalam tampilan editorial bulanan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="app-button-secondary px-3 py-1.5"
          >
            Today
          </button>
          <button
            onClick={() =>
              setCurrentMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
            className="app-button-secondary px-3 py-1.5"
          >
            Prev
          </button>
          <p className="w-44 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthLabel}
          </p>
          <button
            onClick={() =>
              setCurrentMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
            className="app-button-secondary px-3 py-1.5"
          >
            Next
          </button>
        </div>
      </div>

      <div className="app-card flex flex-wrap items-center gap-2 p-3">
        <button
          onClick={() => setShowTake((prev) => !prev)}
          aria-pressed={showTake}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showTake ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          TAKE
        </button>
        <button
          onClick={() => setShowPost((prev) => !prev)}
          aria-pressed={showPost}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showPost ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          POST
        </button>
        <p className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          Klik item untuk buka drawer detail produksi.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="app-skeleton h-72"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading production calendar</span>
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-canvas app-card p-4">
            {!productions.length && (
              <div className="app-empty-state mb-4 p-5">
                Belum ada jadwal produksi. Isi `take_date` atau `post_date` di production board.
              </div>
            )}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="rounded-lg bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  {day}
                </div>
              ))}
              {gridDays.map((day) => {
                const key = formatDateKey(day)
                const items =
                  (itemsByDate.get(key) ?? []).filter(
                    (item) => (showTake && item.type === 'take') || (showPost && item.type === 'post')
                  )
                const inCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const visibleItems = items.slice(0, 3)
                const isToday = isSameDate(day, new Date())

                return (
                  <div
                    key={key}
                    className={`min-h-28 rounded-xl border p-2 transition-colors ${
                      inCurrentMonth
                        ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                        : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500'
                    }`}
                  >
                    <p
                      className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      {day.getDate()}
                    </p>
                    <div className="space-y-1">
                      {visibleItems.map((item, idx) => (
                        <button
                          key={`${item.production.id}-${item.type}-${idx}`}
                          onClick={() => selectProduction(item.production)}
                          className={`w-full truncate rounded-full px-2 py-1 text-left text-[11px] font-medium transition-colors hover:opacity-90 ${
                            item.type === 'take'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.type === 'take' ? 'Take' : 'Post'}: {item.production.title}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[11px] text-slate-500">+{items.length - 3} lainnya</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="workspace-inspector hidden xl:block">
            <div className="app-card h-full overflow-y-auto p-4">
              {selectedProduction ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {selectedProduction.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedProduction.clients?.name ?? '-'}
                    </p>
                  </div>
                  <ProductionDetailView
                    production={selectedProduction}
                    activeTab="SCHEDULE"
                    onGenerateClientLink={async () => {}}
                  />
                  <button onClick={() => setDrawerOpen(true)} className="app-button-primary w-full">
                    Edit Schedule
                  </button>
                </div>
              ) : (
                <div className="app-empty-state flex h-full items-center justify-center py-12">
                  Pilih event pada kalender untuk melihat detail.
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <ProductionDrawer
        key={selectedProduction?.id ?? 'calendar-production-drawer'}
        production={selectedProduction}
        open={drawerOpen}
        isSubmitting={isSavingDrawer}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveDrawer}
      />
    </section>
  )
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

function buildMonthGrid(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  const startOffset = first.getDay()
  for (let i = 0; i < startOffset; i += 1) {
    days.push(new Date(year, month, i - startOffset + 1))
  }
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) {
    const next = new Date(days[days.length - 1])
    next.setDate(next.getDate() + 1)
    days.push(next)
  }
  return days
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODateToLocal(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
