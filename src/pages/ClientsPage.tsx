import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { can } from '../features/auth/permissions'
import { useAuth } from '../features/auth/useAuth'
import { ClientDetailView } from '../features/clients/ClientDetailView'
import { ClientEditForm } from '../features/clients/ClientEditForm'
import type { Client, ClientInsert } from '../features/clients/types'
import {
  createClient,
  getClients,
  setClientArchived,
  updateClient,
  uploadClientLogo,
} from '../services/clientService'
import { logActivity } from '../services/activityLogService'
import { readSavedViews, removeView, saveView, type SavedView } from '../services/savedViewsService'

type ClientFilter = 'active' | 'archived'
type DrawerMode = 'view' | 'edit'
type ClientSavedState = { searchTerm: string; filter: ClientFilter }

function ClientLogo({ client }: { client: Client }) {
  if (client.logo_url) {
    return (
      <img
        src={client.logo_url}
        alt={`${client.name} logo`}
        className="h-12 w-12 rounded-md object-cover"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
      {client.name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('active')
  const [savedViews, setSavedViews] = useState<SavedView<ClientSavedState>[]>(() =>
    readSavedViews<ClientSavedState>('clients')
  )
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const drawerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!drawerOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawerOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const container = drawerRef.current
      if (!container) return
      const focusable = getFocusableElements(container)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.requestAnimationFrame(() => {
      const container = drawerRef.current
      if (!container) return
      const firstFocusable = getFocusableElements(container)[0]
      firstFocusable?.focus()
    })

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      previousFocusRef.current?.focus()
    }
  }, [drawerOpen])

  useEffect(() => {
    let active = true

    async function loadInitialClients() {
      try {
        const data = await getClients()
        if (!active) return
        setClients(data)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load clients.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadInitialClients()
    return () => {
      active = false
    }
  }, [])

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return clients.filter((client) => {
      const archiveMatch = filter === 'active' ? !client.is_archived : client.is_archived
      if (!archiveMatch) return false

      if (!term) return true

      const haystack = `${client.name} ${client.industry ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [clients, filter, searchTerm])

  const canCreateClient = can(user, 'clients.create')
  const canEditClient = can(user, 'clients.edit')
  const canArchiveClient = can(user, 'clients.archive')

  function openClientDrawer(client: Client) {
    setSelectedClient(client)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  function openCreateDrawer() {
    if (!canCreateClient) {
      setError('Akses ditolak: role Anda tidak dapat membuat client baru.')
      return
    }
    setSelectedClient(null)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  async function handleFormSubmit(payload: ClientInsert) {
    const allowed = selectedClient ? canEditClient : canCreateClient
    if (!allowed) {
      setError('Akses ditolak: role Anda tidak dapat menyimpan perubahan client.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedClient) {
        const updated = await updateClient(selectedClient.id, payload)
        setClients((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setSelectedClient(updated)
        await logActivity({
          actorId: user?.id,
          actorEmail: user?.email,
          action: 'client.updated',
          entity: 'client',
          entityId: updated.id,
          details: { clientName: updated.name },
        })
      } else {
        const created = await createClient(payload)
        setClients((prev) => [created, ...prev])
        setSelectedClient(created)
        await logActivity({
          actorId: user?.id,
          actorEmail: user?.email,
          action: 'client.created',
          entity: 'client',
          entityId: created.id,
          details: { clientName: created.name },
        })
      }
      setDrawerMode('view')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save client.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleArchiveToggle() {
    if (!selectedClient) return
    if (!canArchiveClient) {
      setError('Akses ditolak: role Anda tidak dapat mengarsipkan client.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updated = await setClientArchived(selectedClient.id, !selectedClient.is_archived)
      setClients((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedClient(updated)
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: updated.is_archived ? 'client.archived' : 'client.restored',
        entity: 'client',
        entityId: updated.id,
        details: { clientName: updated.name },
      })
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Failed to update archive.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveCurrentView() {
    const viewName = window.prompt('Nama view? (contoh: Active FMCG)')
    if (!viewName?.trim()) return
    const next = saveView<ClientSavedState>('clients', viewName, { searchTerm, filter })
    setSavedViews(next)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.created',
      entity: 'client',
      details: { page: 'clients', viewName },
    })
  }

  async function handleDeleteView(id: string, name: string) {
    const next = removeView<ClientSavedState>('clients', id)
    setSavedViews(next)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.deleted',
      entity: 'client',
      details: { page: 'clients', viewName: name },
    })
  }

  async function handleApplyView(view: SavedView<ClientSavedState>) {
    setSearchTerm(view.state.searchTerm)
    setFilter(view.state.filter)
    await logActivity({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'saved_view.applied',
      entity: 'client',
      details: { page: 'clients', viewName: view.name },
    })
  }

  return (
    <section className="space-y-6" aria-busy={loading} aria-labelledby="clients-page-title">
      <div className="app-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="clients-page-title" className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Brand Foundation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Kelola data klien aktif dan arsip.</p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="app-button-primary"
          disabled={!canCreateClient}
        >
          + Klien Baru
        </button>
      </div>

      <div className="app-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari berdasarkan nama atau industri..."
          className="app-input"
        />
        <div className="flex gap-2" role="group" aria-label="Client archive filter">
          <button
            onClick={() => setFilter('active')}
            aria-pressed={filter === 'active'}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              filter === 'active'
                ? 'bg-slate-900 text-white dark:bg-brand-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilter('archived')}
            aria-pressed={filter === 'archived'}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              filter === 'archived'
                ? 'bg-slate-900 text-white dark:bg-brand-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Arsip
          </button>
        </div>
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
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
          <span className="sr-only">Loading client data</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`client-skeleton-${index}`} className="app-skeleton h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <motion.button
              key={client.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.18 }}
              onClick={() => openClientDrawer(client)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <ClientLogo client={client} />
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    client.is_archived
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {client.is_archived ? 'Arsip' : 'Aktif'}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{client.name}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{client.industry || '-'}</p>
            </motion.button>
          ))}

          {!filteredClients.length && (
            <div className="app-empty-state col-span-full rounded-lg">
              Tidak ada data klien untuk filter saat ini.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-drawer-title"
              aria-describedby="client-drawer-description"
              tabIndex={-1}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 id="client-drawer-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedClient ? selectedClient.name : 'Tambah Klien'}
                  </h2>
                  <p id="client-drawer-description" className="text-sm text-slate-500 dark:text-slate-400">
                    Client drawer
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="app-button-secondary px-3 py-1"
                >
                  Tutup
                </button>
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  disabled={!selectedClient}
                  onClick={() => setDrawerMode('view')}
                  aria-pressed={drawerMode === 'view'}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    drawerMode === 'view'
                      ? 'bg-slate-900 text-white dark:bg-brand-500'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  View
                </button>
                {canEditClient && (
                  <button
                    onClick={() => setDrawerMode('edit')}
                    aria-pressed={drawerMode === 'edit'}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      drawerMode === 'edit'
                        ? 'bg-slate-900 text-white dark:bg-brand-500'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Edit
                  </button>
                )}
                {selectedClient && canArchiveClient && (
                  <button
                    onClick={handleArchiveToggle}
                    disabled={isSubmitting}
                    className="ml-auto rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {selectedClient.is_archived ? 'Restore Client' : 'Archive Client'}
                  </button>
                )}
              </div>

              {drawerMode === 'view' && selectedClient ? (
                <ClientDetailView client={selectedClient} />
              ) : (
                <ClientEditForm
                  key={selectedClient?.id ?? 'new-client'}
                  client={selectedClient}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFormSubmit}
                  onUploadLogo={uploadClientLogo}
                />
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}
