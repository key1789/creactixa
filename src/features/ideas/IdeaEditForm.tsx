import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ActiveClientOption, Idea, IdeaInsert } from './types'

interface IdeaEditFormProps {
  idea: Idea | null
  clients: ActiveClientOption[]
  isSubmitting: boolean
  onSubmit: (payload: IdeaInsert) => Promise<void>
}

const baseForm: IdeaInsert = {
  client_id: '',
  title: '',
  description: '',
  format: '',
  reference_link: '',
  funnel_stage: '',
  content_pillar: '',
}

function normalizeValue(value: string | null | undefined): string {
  return value ?? ''
}

type TextFieldKey = Exclude<keyof IdeaInsert, 'client_id' | 'title' | 'status'>

export function IdeaEditForm({ idea, clients, isSubmitting, onSubmit }: IdeaEditFormProps) {
  const [form, setForm] = useState<IdeaInsert>(() => {
    if (!idea) return baseForm
    return {
      client_id: idea.client_id,
      title: idea.title,
      description: normalizeValue(idea.description),
      format: normalizeValue(idea.format),
      reference_link: normalizeValue(idea.reference_link),
      funnel_stage: normalizeValue(idea.funnel_stage),
      content_pillar: normalizeValue(idea.content_pillar),
      status: idea.status,
    }
  })
  const [formError, setFormError] = useState<string | null>(null)
  const clientError = !form.client_id && formError === 'Client is required.'
  const titleError = !form.title.trim() && formError === 'Title is required.'

  function updateField<K extends keyof IdeaInsert>(key: K, value: IdeaInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const textFields: { key: TextFieldKey; label: string }[] = [
    { key: 'description', label: 'Deskripsi' },
    { key: 'format', label: 'Format' },
    { key: 'funnel_stage', label: 'Funnel' },
    { key: 'content_pillar', label: 'Pilar Konten' },
    { key: 'reference_link', label: 'Link Referensi' },
  ]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.client_id) {
      setFormError('Client is required.')
      return
    }

    if (!form.title?.trim()) {
      setFormError('Title is required.')
      return
    }

    await onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      format: form.format?.trim() || null,
      reference_link: form.reference_link?.trim() || null,
      funnel_stage: form.funnel_stage?.trim() || null,
      content_pillar: form.content_pillar?.trim() || null,
      status: form.status ?? 'INBOX',
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="idea-client">
          Client
        </label>
        <select
          id="idea-client"
          className="app-input"
          value={form.client_id}
          onChange={(e) => updateField('client_id', e.target.value)}
          aria-invalid={clientError}
          aria-describedby={clientError ? 'idea-client-error' : undefined}
          required
        >
          <option value="">Pilih Client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {clientError && (
          <p id="idea-client-error" className="text-xs text-red-600">
            Client is required.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="idea-title">
          Judul
        </label>
        <input
          id="idea-title"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="app-input"
          placeholder="Masukkan judul ide"
          aria-invalid={titleError}
          aria-describedby={titleError ? 'idea-title-error' : undefined}
          required
        />
        {titleError && (
          <p id="idea-title-error" className="text-xs text-red-600">
            Title is required.
          </p>
        )}
      </div>

      {textFields.map((field) => (
        <div className="space-y-1" key={field.key}>
          <label className="text-sm font-medium text-slate-700" htmlFor={field.key}>
            {field.label}
          </label>
          <input
            id={field.key}
            value={normalizeValue(form[field.key] as string | null)}
            onChange={(e) => updateField(field.key, e.target.value)}
            className="app-input"
          />
        </div>
      ))}

      {formError && (
        <p
          id="idea-form-error"
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="app-button-primary w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save Idea'}
      </button>
    </form>
  )
}
