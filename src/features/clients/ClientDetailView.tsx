import type { Client } from './types'

interface ClientDetailViewProps {
  client: Client
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value || '-'}</p>
    </div>
  )
}

function LinkRow({ label, href }: { label: string; href: string | null }) {
  return (
    <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {href ? (
        <a
          className="text-sm text-brand-700 underline underline-offset-2"
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          {href}
        </a>
      ) : (
        <p className="text-sm text-slate-800">-</p>
      )}
    </div>
  )
}

export function ClientDetailView({ client }: ClientDetailViewProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <DetailRow label="Client Name" value={client.name} />
      <DetailRow label="Industry" value={client.industry} />
      <DetailRow label="Description" value={client.description} />
      <DetailRow label="Value Proposition" value={client.value_proposition} />
      <DetailRow label="Brand Voice" value={client.brand_voice} />
      <DetailRow label="Content Pillars" value={client.content_pillars} />
      <LinkRow label="Google Drive Link" href={client.gdrive_link} />
      <LinkRow label="Design Link" href={client.design_link} />
      <DetailRow label="PIC Name" value={client.pic_name} />
      <DetailRow label="PIC WhatsApp" value={client.pic_whatsapp} />
      <LinkRow label="Brand Guideline Link" href={client.brand_guideline_link} />
    </div>
  )
}
