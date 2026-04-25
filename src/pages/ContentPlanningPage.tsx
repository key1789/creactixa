import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { can } from '../features/auth/permissions'
import { useAuth } from '../features/auth/useAuth'
import { IdeaCard } from '../features/ideas/IdeaCard'
import { IdeaDetailView } from '../features/ideas/IdeaDetailView'
import { IdeaEditForm } from '../features/ideas/IdeaEditForm'
import type { ActiveClientOption, Idea, IdeaInsert } from '../features/ideas/types'
import {
  approveIdeaToProduction,
  createIdea,
  getActiveClientsForIdeas,
  getIdeas,
  updateIdea,
} from '../services/ideaService'
import { logActivity } from '../services/activityLogService'
import { readSavedViews, removeView, saveView, type SavedView } from '../services/savedViewsService'

type IdeaTab = 'INBOX' | 'APPROVED'
type DrawerMode = 'view' | 'edit'
type IdeaSavedState = { activeTab: IdeaTab; selectedClientId: string }

export function ContentPlanningPage() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [clients, setClients] = useState<ActiveClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<IdeaTab>('INBOX')
  const [savedViews, setSavedViews] = useState<SavedView<IdeaSavedState>[]>(() =>
    readSavedViews<IdeaSavedState>('content-planning')
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      const [ideaRows, activeClients] = await Promise.all([getIdeas(), getActiveClientsForIdeas()])
      setIdeas(ideaRows)
      setClients(activeClients)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch ideas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      try {
        const [ideaRows, activeClients] = await Promise.all([getIdeas(), getActiveClientsForIdeas()])
        if (!active) return
        setIdeas(ideaRows)
        setClients(activeClients)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch ideas.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitialData()
    return () => {
      active = false
    }
  }, [])

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const tabMatch = idea.status === activeTab
      const clientMatch = selectedClientId === 'all' || idea.client_id === selectedClientId
      return tabMatch && clientMatch
    })
  }, [ideas, activeTab, selectedClientId])

  const canCreateIdea = can(user, 'ideas.create')
  const canEditIdea = can(user, 'ideas.edit')
  const canApproveIdea = can(user, 'ideas.approve')

  function openCreateDrawer() {
    if (!canCreateIdea) {
      setError('Akses ditolak: role Anda tidak dapat membuat ide baru.')
      return
    }
    setSelectedIdea(null)
    setDrawerMode('edit')
    setMobileInspectorOpen(true)
  }

  function openIdeaDrawer(idea: Idea) {
    setSelectedIdea(idea)
    setDrawerMode('view')
    setMobileInspectorOpen(true)
  }

  async function handleSubmit(payload: IdeaInsert) {
    const allowed = selectedIdea ? canEditIdea : canCreateIdea
    if (!allowed) {
      setError('Akses ditolak: role Anda tidak dapat menyimpan ide.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedIdea) {
        const updated = await updateIdea(selectedIdea.id, payload)
        setIdeas((prev) => prev.map((idea) => (idea.id === updated.id ? updated : idea)))
        setSelectedIdea(updated)
        await logActivity({
          actorId: user?.id,
          actorEmail: user?.email,
          action: 'idea.updated',
          entity: 'idea',
          entityId: updated.id,
          details: { title: updated.title, status: updated.status },
        })
      } else {
        const created = await createIdea(payload)
        setIdeas((prev) => [created, ...prev])
        setSelectedIdea(created)
        await logActivity({
          actorId: user?.id,
          actorEmail: user?.email,
          action: 'idea.created',
          entity: 'idea',
          entityId: created.id,
          details: { title: created.title, status: created.status },
        })
      }
      setDrawerMode('view')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save idea.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApproveIdea() {
    if (!selectedIdea) return
    if (!canApproveIdea) {
      setError('Akses ditolak: role Anda tidak dapat approve ide.')
      return
    }

    setIsApproving(true)
    setError(null)

    try {
      const approved = await approveIdeaToProduction(selectedIdea)
      setIdeas((prev) => prev.map((idea) => (idea.id === approved.id ? approved : idea)))
      setSelectedIdea(approved)
      setActiveTab('APPROVED')
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: 'idea.approved_to_production',
        entity: 'idea',
        entityId: approved.id,
        details: { title: approved.title },
      })
      await fetchData()
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Failed to approve idea.')
    } finally {
      setIsApproving(false)
    }
  }

  async function handleSaveCurrentView() {
    const viewName = window.prompt('Nama view? (contoh: Approved - Client A)')
    if (!viewName?.trim()) return
    const next = saveView<IdeaSavedState>('content-planning', viewName, {
      activeTab,
      selectedClientId,
    })
    setSavedViews(next)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.created',
      entity: 'idea',
      details: { page: 'content-planning', viewName },
    })
  }

  async function handleDeleteView(id: string, name: string) {
    const next = removeView<IdeaSavedState>('content-planning', id)
    setSavedViews(next)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.deleted',
      entity: 'idea',
      details: { page: 'content-planning', viewName: name },
    })
  }

  async function handleApplyView(view: SavedView<IdeaSavedState>) {
    setActiveTab(view.state.activeTab)
    setSelectedClientId(view.state.selectedClientId)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.applied',
      entity: 'idea',
      details: { page: 'content-planning', viewName: view.name },
    })
  }

  return (
    <section className="space-y-4" aria-busy={loading} aria-labelledby="ideas-page-title">
      <div className="workspace-header app-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Planning desk</p>
          <h1 id="ideas-page-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Content Planning
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Kelola ide dari INBOX sampai APPROVED dengan alur editorial yang jelas.
          </p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="app-button-primary"
          disabled={!canCreateIdea}
        >
          + Ide Baru
        </button>
      </div>

      <div className="app-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div
          className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
          role="group"
          aria-label="Idea status tabs"
        >
          {(['INBOX', 'APPROVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="app-input w-full md:w-72"
        >
          <option value="all">Semua Client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="app-card flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Saved Views
          </p>
          <button onClick={() => void handleSaveCurrentView()} className="app-button-secondary px-3 py-1.5">
            Save current view
          </button>
        </div>
        {savedViews.length ? (
          <div className="flex flex-wrap gap-2">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  onClick={() => void handleApplyView(view)}
                  className="font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                >
                  {view.name}
                </button>
                <button
                  onClick={() => void handleDeleteView(view.id, view.name)}
                  aria-label={`Delete saved view ${view.name}`}
                  className="rounded px-1 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-300"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada saved view untuk halaman ini.</p>
        )}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
          <span className="sr-only">Loading ideas</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`idea-skeleton-${index}`} className="app-skeleton h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-canvas app-card p-3 md:p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {filteredIdeas.map((idea) => (
                  <motion.div
                    key={idea.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.18 }}
                    className="text-left"
                  >
                    <IdeaCard idea={idea} onClick={openIdeaDrawer} />
                  </motion.div>
                ))}

                {!filteredIdeas.length && (
                  <div className="app-empty-state col-span-full">
                    Tidak ada ide untuk tab/filter saat ini.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="workspace-inspector hidden xl:block">
            <IdeaInspectorPanel
              idea={selectedIdea}
              mode={drawerMode}
              clients={clients}
              isSubmitting={isSubmitting}
              isApproving={isApproving}
              canApprove={canApproveIdea}
              canEdit={canEditIdea}
              onModeChange={setDrawerMode}
              onSubmit={handleSubmit}
              onApprove={handleApproveIdea}
            />
          </aside>
        </div>
      )}

      {mobileInspectorOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/45 xl:hidden"
            aria-label="Tutup panel detail ide"
            onClick={() => setMobileInspectorOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[78vh] rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 xl:hidden">
            <IdeaInspectorPanel
              idea={selectedIdea}
              mode={drawerMode}
              clients={clients}
              isSubmitting={isSubmitting}
              isApproving={isApproving}
              canApprove={canApproveIdea}
              canEdit={canEditIdea}
              onModeChange={setDrawerMode}
              onSubmit={handleSubmit}
              onApprove={handleApproveIdea}
              footerAction={
                <button onClick={() => setMobileInspectorOpen(false)} className="app-button-secondary mt-3 w-full">
                  Tutup Panel
                </button>
              }
            />
          </div>
        </>
      )}
    </section>
  )
}

function IdeaInspectorPanel({
  idea,
  mode,
  clients,
  isSubmitting,
  isApproving,
  canApprove,
  canEdit,
  onModeChange,
  onSubmit,
  onApprove,
  footerAction,
}: {
  idea: Idea | null
  mode: DrawerMode
  clients: ActiveClientOption[]
  isSubmitting: boolean
  isApproving: boolean
  canApprove: boolean
  canEdit: boolean
  onModeChange: (mode: DrawerMode) => void
  onSubmit: (payload: IdeaInsert) => Promise<void>
  onApprove: () => Promise<void>
  footerAction?: ReactNode
}) {
  if (!idea) {
    return (
      <div className="app-card h-full p-4">
        <div className="app-empty-state flex h-full items-center justify-center py-12">
          Pilih ide untuk membuka inspector.
        </div>
      </div>
    )
  }

  return (
    <div className="app-card h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{idea.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{idea.clients?.name ?? '-'}</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => onModeChange('view')}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            mode === 'view'
              ? 'bg-slate-900 text-white dark:bg-brand-500'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          View
        </button>
        {canEdit && (
          <button
            onClick={() => onModeChange('edit')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'edit'
                ? 'bg-slate-900 text-white dark:bg-brand-500'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Edit
          </button>
        )}
      </div>

      {mode === 'view' ? (
        <IdeaDetailView idea={idea} isApproving={isApproving} canApprove={canApprove} onApprove={onApprove} />
      ) : (
        <IdeaEditForm
          key={idea.id}
          idea={idea}
          clients={clients}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      )}
      {footerAction}
    </div>
  )
}
