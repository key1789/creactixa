import { supabase } from './supabase'
import type {
  ActiveClientOption,
  Idea,
  IdeaInsert,
  IdeaStatus,
  IdeaUpdate,
} from '../features/ideas/types'

const IDEA_COLUMNS =
  'id,client_id,title,description,format,reference_link,funnel_stage,content_pillar,status,created_at,clients(name)'

type IdeaRow = Omit<Idea, 'clients'> & {
  clients?: { name: string } | { name: string }[] | null
}

function normalizeIdea(idea: IdeaRow): Idea {
  const clientValue = idea.clients
  const normalizedClient = Array.isArray(clientValue) ? (clientValue[0] ?? null) : clientValue

  return {
    ...idea,
    clients: normalizedClient ?? null,
  }
}

export async function getIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('content_ideas')
    .select(IDEA_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as IdeaRow[]).map(normalizeIdea)
}

export async function createIdea(payload: IdeaInsert): Promise<Idea> {
  const { data, error } = await supabase
    .from('content_ideas')
    .insert({ ...payload, status: payload.status ?? 'INBOX' })
    .select(IDEA_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeIdea(data as IdeaRow)
}

export async function updateIdea(id: string, payload: IdeaUpdate): Promise<Idea> {
  const { data, error } = await supabase
    .from('content_ideas')
    .update(payload)
    .eq('id', id)
    .select(IDEA_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeIdea(data as IdeaRow)
}

export async function updateIdeaStatus(id: string, status: IdeaStatus): Promise<Idea> {
  const { data, error } = await supabase
    .from('content_ideas')
    .update({ status })
    .eq('id', id)
    .select(IDEA_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeIdea(data as IdeaRow)
}

export async function getActiveClientsForIdeas(): Promise<ActiveClientOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id,name')
    .eq('is_archived', false)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as ActiveClientOption[]
}

export async function approveIdeaToProduction(idea: Idea): Promise<Idea> {
  const approvedIdea = await updateIdeaStatus(idea.id, 'APPROVED')

  const { error: productionError } = await supabase.from('productions').insert({
    idea_id: idea.id,
    client_id: idea.client_id,
    title: idea.title,
    format: idea.format,
    status: 'WAITING SCHEDULE',
  })

  if (productionError) {
    // Best-effort rollback to keep data consistent when production insert fails.
    await updateIdeaStatus(idea.id, idea.status)
    throw new Error(productionError.message)
  }

  return approvedIdea
}
