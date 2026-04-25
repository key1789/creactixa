import type { Production, ProductionTab } from './types'

interface ProductionDetailViewProps {
  production: Production
  activeTab: ProductionTab
  onGenerateClientLink: () => Promise<void>
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-slate-800">{value || '-'}</p>
    </div>
  )
}

export function ProductionDetailView({
  production,
  activeTab,
  onGenerateClientLink,
}: ProductionDetailViewProps) {
  if (activeTab === 'SCRIPT') {
    return (
      <div className="space-y-4">
        <Row label="Hook" value={production.script_hook} />
        <Row label="Body" value={production.script_body} />
        <Row label="CTA" value={production.script_cta} />
        <Row label="Visual Direction" value={production.visual_direction} />
        <button
          onClick={() => void onGenerateClientLink()}
          className="app-button-primary w-full"
        >
          Generate Client Link
        </button>
      </div>
    )
  }

  if (activeTab === 'NEEDS') {
    return (
      <div className="space-y-4">
        <Row label="Talent" value={production.needs_talent} />
        <Row label="Location" value={production.needs_location} />
        <Row label="Props" value={production.needs_props} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Row label="Take Date" value={production.take_date} />
      <Row label="Post Date" value={production.post_date} />
      <Row label="Revision Notes" value={production.revision_notes} />
    </div>
  )
}
