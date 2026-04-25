import type { Idea } from './types'

interface IdeaDetailViewProps {
  idea: Idea
  isApproving: boolean
  canApprove?: boolean
  onApprove: () => Promise<void>
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value || '-'}</p>
    </div>
  )
}

export function IdeaDetailView({
  idea,
  isApproving,
  canApprove = true,
  onApprove,
}: IdeaDetailViewProps) {
  return (
    <div className="space-y-4">
      <Row label="Title" value={idea.title} />
      <Row label="Client" value={idea.clients?.name ?? null} />
      <Row label="Status" value={idea.status} />
      <Row label="Description" value={idea.description} />
      <Row label="Format" value={idea.format} />
      <Row label="Funnel Stage" value={idea.funnel_stage} />
      <Row label="Content Pillar" value={idea.content_pillar} />
      <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Reference Link
        </p>
        {idea.reference_link ? (
          <a
            href={idea.reference_link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-700 underline underline-offset-2"
          >
            {idea.reference_link}
          </a>
        ) : (
          <p className="text-sm text-slate-800">-</p>
        )}
      </div>

      {idea.status === 'INBOX' && canApprove && (
        <button
          onClick={() => void onApprove()}
          disabled={isApproving}
          className="app-button-primary w-full"
        >
          {isApproving ? 'Approving...' : 'Approve ke Produksi'}
        </button>
      )}
    </div>
  )
}
