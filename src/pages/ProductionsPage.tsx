import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { can } from '../features/auth/permissions'
import { useAuth } from '../features/auth/useAuth'
import { ProductionCard } from '../features/productions/ProductionCard'
import { ProductionDetailView } from '../features/productions/ProductionDetailView'
import { ProductionEditForm } from '../features/productions/ProductionEditForm'
import {
  PRODUCTION_STATUSES,
  type ProductionTab,
  type Production,
  type ProductionStatus,
  type ProductionUpdate,
} from '../features/productions/types'
import {
  getProductions,
  updateProduction,
  updateProductionStatus,
} from '../services/productionService'
import { logActivity } from '../services/activityLogService'

const EXECUTION_STATUSES: ProductionStatus[] = [
  'ON SHOOTING',
  'ON EDITING',
  'INTERNAL QC',
  'WAIT CLIENT APPROVAL',
  'REVISION',
  'APPROVED',
  'POSTING',
]

export function ProductionsPage() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)
  const [inspectorMode, setInspectorMode] = useState<'view' | 'edit'>('view')
  const [inspectorTab, setInspectorTab] = useState<ProductionTab>('SCRIPT')
  const [isSavingDrawer, setIsSavingDrawer] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    let active = true

    async function loadInitialProductions() {
      try {
        const data = await getProductions()
        if (!active) return
        setProductions(data)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch productions.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitialProductions()
    return () => {
      active = false
    }
  }, [])

  const grouped = useMemo(() => {
    return PRODUCTION_STATUSES.reduce<Record<ProductionStatus, Production[]>>((acc, status) => {
      acc[status] = productions.filter((item) => item.status === status)
      return acc
    }, {} as Record<ProductionStatus, Production[]>)
  }, [productions])

  const activeDragItem = useMemo(
    () => productions.find((item) => item.id === activeDragId) ?? null,
    [productions, activeDragId]
  )
  const canEditProduction = can(user, 'productions.edit')
  const canDragProduction = can(user, 'productions.drag')
  const hasInspector = Boolean(selectedProduction)

  useEffect(() => {
    function onToggleInspector() {
      if (!selectedProduction) return
      setMobileInspectorOpen((prev) => !prev)
    }

    window.addEventListener('workspace-toggle-inspector', onToggleInspector)
    return () => window.removeEventListener('workspace-toggle-inspector', onToggleInspector)
  }, [selectedProduction])

  function handleDragStart(event: DragStartEvent) {
    if (!canDragProduction) return
    setActiveDragId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!canDragProduction) {
      setActiveDragId(null)
      return
    }
    setActiveDragId(null)

    const activeId = String(event.active.id)
    if (!event.over) return

    const overId = String(event.over.id)
    const dragged = productions.find((item) => item.id === activeId)
    if (!dragged) return

    const overProduction = productions.find((item) => item.id === overId)
    const targetStatus: ProductionStatus =
      (PRODUCTION_STATUSES.find((status) => status === overId) as ProductionStatus | undefined) ??
      overProduction?.status ??
      dragged.status

    if (targetStatus === dragged.status) {
      return
    }

    if (EXECUTION_STATUSES.includes(targetStatus) && !dragged.take_date) {
      setError(
        'Tidak bisa pindah ke kolom eksekusi sebelum Take Date diisi di tab SCHEDULE.'
      )
      return
    }

    const previousState = productions
    const optimistic = productions.map((item) =>
      item.id === dragged.id ? { ...item, status: targetStatus } : item
    )

    setProductions(optimistic)

    try {
      const updated = await updateProductionStatus(dragged.id, targetStatus)
      setProductions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: 'production.status_changed',
        entity: 'production',
        entityId: updated.id,
        details: { from: dragged.status, to: targetStatus, title: updated.title },
      })
    } catch (updateError) {
      setProductions(previousState)
      setError(updateError instanceof Error ? updateError.message : 'Failed to update status.')
    }
  }

  function openDrawer(production: Production) {
    setSelectedProduction(production)
    setInspectorMode('view')
    setInspectorTab('SCRIPT')
    setMobileInspectorOpen(true)
  }

  async function handleSaveDrawer(payload: ProductionUpdate) {
    if (!selectedProduction) return
    if (!canEditProduction) {
      setError('Akses ditolak: role Anda tidak dapat mengubah data produksi.')
      return
    }
    setIsSavingDrawer(true)
    setError(null)
    try {
      const updated = await updateProduction(selectedProduction.id, payload)
      setProductions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedProduction(updated)
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: 'production.updated',
        entity: 'production',
        entityId: updated.id,
        details: { title: updated.title, status: updated.status },
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update production.')
    } finally {
      setIsSavingDrawer(false)
    }
  }

  async function handleGenerateClientLink() {
    if (!selectedProduction) return
    const url = `${window.location.origin}/view/${selectedProduction.id}`
    await navigator.clipboard.writeText(url)
  }

  return (
    <section className="space-y-3" aria-busy={loading} aria-labelledby="productions-page-title">
      <div className="workspace-header app-card p-4 md:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Execution workspace</p>
          <h1 id="productions-page-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Production Content
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Kelola board produksi dengan canvas + inspector seperti workflow studio.
          </p>
        </div>
        {hasInspector && (
          <button
            onClick={() => setMobileInspectorOpen((prev) => !prev)}
            className="app-button-secondary mt-3 px-3 py-1.5 md:hidden"
          >
            {mobileInspectorOpen ? 'Tutup Detail' : 'Buka Detail'}
          </button>
        )}
        {!canDragProduction && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
            Role Anda hanya dapat melihat board, tanpa drag-and-drop status.
          </p>
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
        <div
          className="app-skeleton h-40"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading production board</span>
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-canvas app-card p-3 md:p-4">
            <div className="overflow-x-auto pb-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={(event) => void handleDragEnd(event)}
              >
                <div className="flex min-w-max gap-4">
                  {PRODUCTION_STATUSES.map((status) => (
                    <StatusColumn
                      key={status}
                      status={status}
                      items={grouped[status] ?? []}
                      onCardClick={openDrawer}
                      canDrag={canDragProduction}
                    />
                  ))}
                </div>
                {!productions.length && (
                  <div className="app-empty-state mt-4 min-w-[380px]">
                    Belum ada data produksi. Tambahkan ide yang di-approve untuk mulai mengisi board.
                  </div>
                )}
                <DragOverlay>
                  {activeDragItem ? (
                    <ProductionCard production={activeDragItem} onClick={openDrawer} isOverlay />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          <aside className="workspace-inspector hidden xl:block">
            <ProductionInspectorPanel
              production={selectedProduction}
              mode={inspectorMode}
              tab={inspectorTab}
              isSubmitting={isSavingDrawer || !canEditProduction}
              onModeChange={setInspectorMode}
              onTabChange={setInspectorTab}
              onSave={handleSaveDrawer}
              onGenerateClientLink={handleGenerateClientLink}
            />
          </aside>
        </div>
      )}

      {hasInspector && mobileInspectorOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/45 xl:hidden"
            aria-label="Tutup panel detail"
            onClick={() => setMobileInspectorOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[78vh] rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 xl:hidden">
            <ProductionInspectorPanel
              production={selectedProduction}
              mode={inspectorMode}
              tab={inspectorTab}
              isSubmitting={isSavingDrawer || !canEditProduction}
              onModeChange={setInspectorMode}
              onTabChange={setInspectorTab}
              onSave={handleSaveDrawer}
              onGenerateClientLink={handleGenerateClientLink}
              footerAction={
                <button
                  onClick={() => setMobileInspectorOpen(false)}
                  className="app-button-secondary mt-3 w-full px-3 py-1.5"
                >
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

function ProductionInspectorPanel({
  production,
  mode,
  tab,
  isSubmitting,
  onModeChange,
  onTabChange,
  onSave,
  onGenerateClientLink,
  footerAction,
}: {
  production: Production | null
  mode: 'view' | 'edit'
  tab: ProductionTab
  isSubmitting: boolean
  onModeChange: (mode: 'view' | 'edit') => void
  onTabChange: (tab: ProductionTab) => void
  onSave: (payload: ProductionUpdate) => Promise<void>
  onGenerateClientLink: () => Promise<void>
  footerAction?: ReactNode
}) {
  if (!production) {
    return (
      <div className="app-card h-full p-4">
        <div className="app-empty-state flex h-full items-center justify-center py-12">
          Pilih salah satu kartu produksi untuk membuka inspector.
        </div>
      </div>
    )
  }

  return (
    <div className="app-card h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{production.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{production.clients?.name ?? '-'}</p>
      </div>

      <div className="mb-3 flex gap-2">
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
      </div>

      <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['SCRIPT', 'NEEDS', 'SCHEDULE'] as const).map((item) => (
          <button
            key={item}
            onClick={() => onTabChange(item)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === item
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {mode === 'view' ? (
        <ProductionDetailView production={production} activeTab={tab} onGenerateClientLink={onGenerateClientLink} />
      ) : (
        <ProductionEditForm
          key={`${production.id}-${tab}`}
          production={production}
          activeTab={tab}
          isSubmitting={isSubmitting}
          onSubmit={onSave}
        />
      )}
      {footerAction}
    </div>
  )
}

function StatusColumn({
  status,
  items,
  onCardClick,
  canDrag,
}: {
  status: ProductionStatus
  items: Production[]
  onCardClick: (production: Production) => void
  canDrag: boolean
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div className="w-80 shrink-0 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">{status}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {items.length}
        </span>
      </div>
      <div ref={setNodeRef} className="min-h-16 space-y-3">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableProductionCard key={item.id} item={item} onClick={onCardClick} canDrag={canDrag} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function SortableProductionCard({
  item,
  onClick,
  canDrag,
}: {
  item: Production
  onClick: (production: Production) => void
  canDrag: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-60' : ''}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
    >
      <ProductionCard production={item} onClick={onClick} />
    </div>
  )
}
