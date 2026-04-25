import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Production } from '../features/productions/types'
import { getProductionById } from '../services/productionService'

export function ClientViewPage() {
  const { id } = useParams<{ id: string }>()
  const [production, setProduction] = useState<Production | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const data = await getProductionById(id)
        setProduction(data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load client view.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:p-10">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-200/60" />
      </main>
    )
  }

  if (error || !production) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:p-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? 'Data produksi tidak ditemukan.'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <header className="rounded-xl border border-slate-200 bg-white/90 p-6 shadow-editorial">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Client script view</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{production.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Dokumen naskah untuk review klien.</p>
      </header>

      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-editorial">
        <Block title="Hook" content={production.script_hook} />
        <Block title="Body" content={production.script_body} />
        <Block title="CTA" content={production.script_cta} />
        <Block title="Visual Direction" content={production.visual_direction} />
      </section>
    </main>
  )
}

function Block({ title, content }: { title: string; content: string | null }) {
  return (
    <article className="space-y-2 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{content || '-'}</p>
    </article>
  )
}
