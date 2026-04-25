import { useEffect, useState } from 'react'
import type { ActivityLogItem } from '../services/activityLogService'
import { getActivityLogs } from '../services/activityLogService'

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadLogs() {
      setLoading(true)
      setError(null)

      try {
        const data = await getActivityLogs(120)
        if (!active) return
        setLogs(data)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load activity logs.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadLogs()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="space-y-4" aria-busy={loading} aria-labelledby="activity-log-title">
      <div className="workspace-header app-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Audit trail</p>
        <h1 id="activity-log-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Activity Log
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Rekam jejak aksi penting user di seluruh workflow.
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
        <div className="workspace-grid">
          <div className="workspace-canvas app-card p-4" role="status" aria-live="polite">
            <span className="sr-only">Loading activity logs</span>
            <div className="app-skeleton h-48 border-0" />
          </div>
          <aside className="workspace-inspector hidden xl:block">
            <div className="app-card h-full p-4">
              <div className="app-skeleton h-40 border-0" />
            </div>
          </aside>
        </div>
      ) : (
        <div className="workspace-grid">
          <div className="workspace-canvas app-card overflow-x-auto p-2">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                  >
                    <td className="px-3 py-2">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{log.actor_email ?? '-'}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2 capitalize">{log.entity}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {log.entity_id ?? '-'}
                    </td>
                  </tr>
                ))}

                {!logs.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8">
                      <div className="app-empty-state py-6">Belum ada aktivitas tercatat.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <aside className="workspace-inspector hidden xl:block">
            <div className="app-card h-full p-4">
              <h2 className="app-section-title">Insight Cepat</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Total event tercatat: <span className="font-semibold">{logs.length}</span>
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Actor unik: <span className="font-semibold">{new Set(logs.map((item) => item.actor_email)).size}</span>
              </p>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Gunakan panel ini untuk monitoring cepat sebelum audit detail.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
