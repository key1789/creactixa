export const PRODUCTION_STATUSES = [
  'WAITING SCHEDULE',
  'ON SHOOTING',
  'ON EDITING',
  'INTERNAL QC',
  'WAIT CLIENT APPROVAL',
  'REVISION',
  'APPROVED',
  'POSTING',
] as const

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number]

export interface Production {
  id: string
  idea_id: string
  client_id: string
  title: string
  format: string | null
  script_hook: string | null
  script_body: string | null
  script_cta: string | null
  visual_direction: string | null
  needs_talent: string | null
  needs_location: string | null
  needs_props: string | null
  take_date: string | null
  post_date: string | null
  status: ProductionStatus
  revision_notes: string | null
  created_at: string
  clients?: {
    name: string
    is_archived?: boolean
  } | null
}

export type ProductionUpdate = Partial<
  Pick<
    Production,
    | 'title'
    | 'format'
    | 'script_hook'
    | 'script_body'
    | 'script_cta'
    | 'visual_direction'
    | 'needs_talent'
    | 'needs_location'
    | 'needs_props'
    | 'take_date'
    | 'post_date'
    | 'revision_notes'
  >
>

export type ProductionTab = 'SCRIPT' | 'NEEDS' | 'SCHEDULE'
