import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Production, ProductionTab, ProductionUpdate } from './types'

interface ProductionEditFormProps {
  production: Production
  activeTab: ProductionTab
  isSubmitting: boolean
  onSubmit: (payload: ProductionUpdate) => Promise<void>
}

export function ProductionEditForm({
  production,
  activeTab,
  isSubmitting,
  onSubmit,
}: ProductionEditFormProps) {
  const [form, setForm] = useState<ProductionUpdate>(() => ({
    title: production.title,
    format: production.format,
    script_hook: production.script_hook,
    script_body: production.script_body,
    script_cta: production.script_cta,
    visual_direction: production.visual_direction,
    needs_talent: production.needs_talent,
    needs_location: production.needs_location,
    needs_props: production.needs_props,
    take_date: production.take_date,
    post_date: production.post_date,
    revision_notes: production.revision_notes,
  }))

  function updateField<K extends keyof ProductionUpdate>(key: K, value: ProductionUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      ...form,
      title: form.title?.trim() || production.title,
      format: form.format?.trim() || null,
      script_hook: form.script_hook?.trim() || null,
      script_body: form.script_body?.trim() || null,
      script_cta: form.script_cta?.trim() || null,
      visual_direction: form.visual_direction?.trim() || null,
      needs_talent: form.needs_talent?.trim() || null,
      needs_location: form.needs_location?.trim() || null,
      needs_props: form.needs_props?.trim() || null,
      revision_notes: form.revision_notes?.trim() || null,
      take_date: form.take_date || null,
      post_date: form.post_date || null,
    })
  }

  if (activeTab === 'SCRIPT') {
    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p id="production-form-help" className="sr-only">
          Update production fields, then save changes.
        </p>
        <Field
          label="Hook"
          value={form.script_hook ?? ''}
          onChange={(value) => updateField('script_hook', value)}
          describedBy="production-form-help"
        />
        <Field
          label="Body"
          value={form.script_body ?? ''}
          onChange={(value) => updateField('script_body', value)}
          isTextarea
          describedBy="production-form-help"
        />
        <Field
          label="CTA"
          value={form.script_cta ?? ''}
          onChange={(value) => updateField('script_cta', value)}
          describedBy="production-form-help"
        />
        <Field
          label="Visual Direction"
          value={form.visual_direction ?? ''}
          onChange={(value) => updateField('visual_direction', value)}
          isTextarea
          describedBy="production-form-help"
        />
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    )
  }

  if (activeTab === 'NEEDS') {
    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p id="production-form-help" className="sr-only">
          Update production fields, then save changes.
        </p>
        <Field
          label="Talent"
          value={form.needs_talent ?? ''}
          onChange={(value) => updateField('needs_talent', value)}
          describedBy="production-form-help"
        />
        <Field
          label="Location"
          value={form.needs_location ?? ''}
          onChange={(value) => updateField('needs_location', value)}
          describedBy="production-form-help"
        />
        <Field
          label="Props"
          value={form.needs_props ?? ''}
          onChange={(value) => updateField('needs_props', value)}
          isTextarea
          describedBy="production-form-help"
        />
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p id="production-form-help" className="sr-only">
        Update production fields, then save changes.
      </p>
      <DateField
        label="Take Date"
        value={form.take_date ?? ''}
        onChange={(value) => updateField('take_date', value || null)}
        describedBy="production-form-help"
      />
      <DateField
        label="Post Date"
        value={form.post_date ?? ''}
        onChange={(value) => updateField('post_date', value || null)}
        describedBy="production-form-help"
      />
      <Field
        label="Revision Notes"
        value={form.revision_notes ?? ''}
        onChange={(value) => updateField('revision_notes', value)}
        isTextarea
        describedBy="production-form-help"
      />
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  isTextarea = false,
  describedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  isTextarea?: boolean
  describedBy?: string
}) {
  const inputId = `production-field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700" htmlFor={inputId}>
        {label}
      </label>
      {isTextarea ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="app-input"
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="app-input"
          aria-describedby={describedBy}
        />
      )}
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
  describedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  describedBy?: string
}) {
  const inputId = `production-field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-input"
        aria-describedby={describedBy}
      />
    </div>
  )
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="app-button-primary w-full"
    >
      {isSubmitting ? 'Saving...' : 'Save Changes'}
    </button>
  )
}
