import type { Production } from './types'

const clientBadgeStyles = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
]

interface ProductionCardProps {
  production: Production
  onClick?: (production: Production) => void
  isOverlay?: boolean
}

export function ProductionCard({ production, onClick, isOverlay = false }: ProductionCardProps) {
  const alertBorder = isNearDeadline(production.post_date)
  const badgeStyle = getClientBadgeClass(production.client_id)

  return (
    <button
      onClick={() => onClick?.(production)}
      className={`w-full rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:bg-slate-900 ${
        alertBorder ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-800'
      } ${isOverlay ? 'cursor-grabbing' : 'cursor-pointer'}`}
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{production.title}</h3>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
          {production.clients?.name ?? 'Unknown Client'}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{production.post_date ?? 'No date'}</span>
      </div>
    </button>
  )
}

function isNearDeadline(postDate: string | null): boolean {
  if (!postDate) return false
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const date = new Date(postDate)
  const startPost = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startPost.getTime() - startToday.getTime()) / 86400000)
  return diffDays === 0 || diffDays === 1
}

function getClientBadgeClass(clientId: string): string {
  const hash = Array.from(clientId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return clientBadgeStyles[hash % clientBadgeStyles.length]
}
