import type { Production, ProductionStatus, ProductionUpdate } from '../features/productions/types'
import { supabase } from './supabase'

const PRODUCTION_COLUMNS =
  'id,idea_id,client_id,title,format,script_hook,script_body,script_cta,visual_direction,needs_talent,needs_location,needs_props,take_date,post_date,status,revision_notes,created_at,clients(name,is_archived)'

type ProductionRow = Omit<Production, 'clients'> & {
  clients?: { name: string; is_archived?: boolean } | { name: string; is_archived?: boolean }[] | null
}

function normalizeProduction(row: ProductionRow): Production {
  const clientValue = row.clients
  const normalizedClient = Array.isArray(clientValue) ? (clientValue[0] ?? null) : clientValue
  return { ...row, clients: normalizedClient ?? null }
}

export async function getProductions(): Promise<Production[]> {
  const { data, error } = await supabase
    .from('productions')
    .select(PRODUCTION_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as ProductionRow[]).map(normalizeProduction)
}

export async function getProductionById(id: string): Promise<Production> {
  const { data, error } = await supabase
    .from('productions')
    .select(PRODUCTION_COLUMNS)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeProduction(data as ProductionRow)
}

export async function updateProduction(id: string, payload: ProductionUpdate): Promise<Production> {
  const { data, error } = await supabase
    .from('productions')
    .update(payload)
    .eq('id', id)
    .select(PRODUCTION_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeProduction(data as ProductionRow)
}

export async function updateProductionStatus(
  id: string,
  status: ProductionStatus
): Promise<Production> {
  const { data, error } = await supabase
    .from('productions')
    .update({ status })
    .eq('id', id)
    .select(PRODUCTION_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeProduction(data as ProductionRow)
}
