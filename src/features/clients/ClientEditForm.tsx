import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Client, ClientInsert } from './types'

interface ClientEditFormProps {
  client: Client | null
  isSubmitting: boolean
  onSubmit: (payload: ClientInsert) => Promise<void>
  onUploadLogo: (file: File) => Promise<string>
}

const baseFormState: ClientInsert = {
  name: '',
  logo_url: null,
  industry: '',
  description: '',
  value_proposition: '',
  brand_voice: '',
  content_pillars: '',
  gdrive_link: '',
  design_link: '',
  pic_name: '',
  pic_whatsapp: '',
  brand_guideline_link: '',
}

type TextFieldKey = Exclude<keyof ClientInsert, 'name' | 'logo_url'>

function normalizeNullable(value: string | null | undefined): string {
  return value ?? ''
}

export function ClientEditForm({
  client,
  isSubmitting,
  onSubmit,
  onUploadLogo,
}: ClientEditFormProps) {
  const [form, setForm] = useState<ClientInsert>(() => {
    if (!client) return baseFormState
    return {
      name: client.name,
      logo_url: client.logo_url,
      industry: normalizeNullable(client.industry),
      description: normalizeNullable(client.description),
      value_proposition: normalizeNullable(client.value_proposition),
      brand_voice: normalizeNullable(client.brand_voice),
      content_pillars: normalizeNullable(client.content_pillars),
      gdrive_link: normalizeNullable(client.gdrive_link),
      design_link: normalizeNullable(client.design_link),
      pic_name: normalizeNullable(client.pic_name),
      pic_whatsapp: normalizeNullable(client.pic_whatsapp),
      brand_guideline_link: normalizeNullable(client.brand_guideline_link),
    }
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const nameError = !form.name.trim() && formError === 'Client name is required.'

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFormError(null)
    setUploadingLogo(true)

    try {
      const logoUrl = await onUploadLogo(file)
      setForm((prev) => ({ ...prev, logo_url: logoUrl }))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.name?.trim()) {
      setFormError('Client name is required.')
      return
    }

    await onSubmit({
      ...form,
      name: form.name.trim(),
      industry: form.industry?.trim() || null,
      description: form.description?.trim() || null,
      value_proposition: form.value_proposition?.trim() || null,
      brand_voice: form.brand_voice?.trim() || null,
      content_pillars: form.content_pillars?.trim() || null,
      gdrive_link: form.gdrive_link?.trim() || null,
      design_link: form.design_link?.trim() || null,
      pic_name: form.pic_name?.trim() || null,
      pic_whatsapp: form.pic_whatsapp?.trim() || null,
      brand_guideline_link: form.brand_guideline_link?.trim() || null,
    })
  }

  function updateField<K extends keyof ClientInsert>(key: K, value: ClientInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const textFields: { key: TextFieldKey; label: string }[] = [
    { key: 'industry', label: 'Industry' },
    { key: 'description', label: 'Description' },
    { key: 'value_proposition', label: 'Value Proposition' },
    { key: 'brand_voice', label: 'Brand Voice' },
    { key: 'content_pillars', label: 'Content Pillars' },
    { key: 'gdrive_link', label: 'Google Drive Link' },
    { key: 'design_link', label: 'Design Link' },
    { key: 'pic_name', label: 'PIC Name' },
    { key: 'pic_whatsapp', label: 'PIC WhatsApp' },
    { key: 'brand_guideline_link', label: 'Brand Guideline Link' },
  ]

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="client-name">
          Client Name
        </label>
        <input
          id="client-name"
          className="app-input"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Input client name"
          aria-invalid={nameError}
          aria-describedby={nameError ? 'client-name-error' : undefined}
          required
        />
        {nameError && (
          <p id="client-name-error" className="text-xs text-red-600">
            Client name is required.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="client-logo">
          Logo
        </label>
        <input
          id="client-logo"
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="block w-full text-sm text-slate-700"
        />
        {uploadingLogo && <p className="text-xs text-slate-500">Uploading logo...</p>}
        {form.logo_url && (
          <img
            src={form.logo_url}
            alt="Client logo preview"
            className="h-14 w-14 rounded-md border border-slate-200 object-cover"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {textFields.map((field) => (
          <div className="space-y-1" key={field.key}>
            <label className="text-sm font-medium text-slate-700" htmlFor={field.key}>
              {field.label}
            </label>
            <input
              id={field.key}
              className="app-input"
              value={normalizeNullable(form[field.key] as string | null)}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {formError && (
        <p
          id="client-form-error"
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || uploadingLogo}
        className="app-button-primary w-full"
      >
        {isSubmitting ? 'Saving...' : 'Save Client'}
      </button>
    </form>
  )
}
