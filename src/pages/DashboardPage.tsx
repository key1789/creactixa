import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IdeaCard } from '../features/ideas/IdeaCard'
import type { Idea } from '../features/ideas/types'
import { ProductionCard } from '../features/productions/ProductionCard'
import type { Production } from '../features/productions/types'
import { getIdeas } from '../services/ideaService'
import { getProductions } from '../services/productionService'

export function DashboardPage() {
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [ideaRows, productionRows] = await Promise.all([getIdeas(), getProductions()])
        setIdeas(ideaRows)
        setProductions(productionRows)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [])

  const actionRequiredIdeas = useMemo(
    () => ideas.filter((idea) => idea.status === 'INBOX').slice(0, 5),
    [ideas]
  )
  const actionRequiredProductions = useMemo(
    () => productions.filter((item) => item.status === 'REVISION').slice(0, 5),
    [productions]
  )
  const upcomingPosting = useMemo(
    () =>
      productions
        .filter((item) => isInNext7Days(item.post_date))
        .sort((a, b) => (a.post_date ?? '').localeCompare(b.post_date ?? ''))
        .slice(0, 7),
    [productions]
  )

  return (
    <section className="space-y-4">
      <div className="workspace-header app-card overflow-hidden p-6 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Morning briefing</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Editorial Control Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Pantau prioritas hari ini, percepat approval, dan jaga jadwal posting tetap on-track.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="workspace-grid">
          <SkeletonBlock />
          <SkeletonBlock className="hidden xl:block" />
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-canvas grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="app-card space-y-3 p-4 xl:col-span-3">
            <h2 className="app-section-title">Quick Actions</h2>
            <Link
              className="app-button-primary w-full"
              to="/clients"
            >
              + Klien Baru
            </Link>
            <Link
              className="app-button-secondary w-full"
              to="/content-planning"
            >
              + Ide Baru
            </Link>
            <Link className="app-button-secondary w-full" to="/productions">
              Buka Production Board
            </Link>
          </section>

          <section className="app-card space-y-4 p-4 xl:col-span-5">
            <h2 className="app-section-title">Action Required</h2>
            <div className="space-y-2">
              {actionRequiredIdeas.map((idea) => (
                <motion.div key={idea.id} whileHover={{ y: -2 }} transition={{ duration: 0.12 }}>
                  <IdeaCard idea={idea} onClick={() => navigate('/content-planning')} />
                </motion.div>
              ))}
              {actionRequiredProductions.map((item) => (
                <motion.div key={item.id} whileHover={{ y: -2 }} transition={{ duration: 0.12 }}>
                  <ProductionCard production={item} onClick={() => navigate('/productions')} />
                </motion.div>
              ))}
              {!actionRequiredIdeas.length && !actionRequiredProductions.length && (
                <p className="app-empty-state p-4">Tidak ada item prioritas saat ini.</p>
              )}
            </div>
          </section>

          <section className="app-card space-y-4 p-4 xl:col-span-4">
            <h2 className="app-section-title">Upcoming Posting</h2>
            <div className="space-y-2">
              {upcomingPosting.map((item) => (
                <ProductionCard
                  key={item.id}
                  production={item}
                  onClick={() => navigate('/productions')}
                />
              ))}
              {!upcomingPosting.length && (
                <p className="app-empty-state p-4">Belum ada jadwal posting 7 hari ke depan.</p>
              )}
            </div>
          </section>
          </div>
          <aside className="workspace-inspector hidden xl:block">
            <div className="app-card h-full p-4">
              <h2 className="app-section-title">Workspace Hints</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Gunakan Command Palette (`Ctrl/Cmd + K`) untuk navigasi cepat dan panel notifikasi untuk memantau aksi terbaru tim.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>- Prioritaskan kartu dengan status INBOX dan REVISION.</p>
                <p>- Gunakan Saved Views agar workflow berulang lebih cepat.</p>
                <p>- Role-based access aktif pada aksi sensitif.</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`app-card p-4 ${className}`}>
      <div className="app-skeleton h-52 border-0" />
    </div>
  )
}

function isInNext7Days(postDate: string | null): boolean {
  if (!postDate) return false
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const maxDate = new Date(startToday)
  maxDate.setDate(maxDate.getDate() + 7)
  const date = new Date(postDate)
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return normalized >= startToday && normalized <= maxDate
}
