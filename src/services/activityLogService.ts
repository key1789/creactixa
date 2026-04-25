import { supabase } from './supabase'

export type ActivityEntity = 'client' | 'idea' | 'production' | 'auth'

export interface ActivityLogInput {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  entity: ActivityEntity
  entityId?: string | null
  details?: Record<string, unknown> | null
}

export interface ActivityLogItem {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity: ActivityEntity
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTIVITY_COLUMNS =
  'id,actor_id,actor_email,action,entity,entity_id,details,created_at'

export async function logActivity(input: ActivityLogInput): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail ?? null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    details: input.details ?? null,
  })

  if (error) {
    // Keep core workflows resilient even if activity_logs is unavailable.
    console.warn('[activity_logs] insert failed:', error.message)
  }
}

export async function getActivityLogs(limit = 100): Promise<ActivityLogItem[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(ACTIVITY_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ActivityLogItem[]
}
