import type { Idea, IdeaStatus } from './types'

interface IdeaCardProps {
  idea: Idea
  onClick?: (idea: Idea) => void
}

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  return (
    <button
      onClick={() => onClick?.(idea)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{idea.title}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(idea.status)}`}
        >
          {idea.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Client: {idea.clients?.name ?? '-'}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Funnel: {idea.funnel_stage ?? '-'}</p>
    </button>
  )
}

function getStatusBadgeClass(status: IdeaStatus) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (status === 'REVISION') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}
