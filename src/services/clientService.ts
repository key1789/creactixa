import { supabase } from './supabase'
import type { Client, ClientInsert, ClientUpdate } from '../features/clients/types'

const CLIENT_COLUMNS =
  'id,name,logo_url,industry,description,value_proposition,brand_voice,content_pillars,gdrive_link,design_link,pic_name,pic_whatsapp,brand_guideline_link,is_archived,created_at'

function normalizePublicLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null
  if (logoUrl.includes('/storage/v1/object/public/')) return logoUrl
  if (logoUrl.includes('/storage/v1/object/')) {
    return logoUrl.replace('/storage/v1/object/', '/storage/v1/object/public/')
  }
  return logoUrl
}

function normalizeClient(client: Client): Client {
  return {
    ...client,
    logo_url: normalizePublicLogoUrl(client.logo_url),
  }
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select(CLIENT_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Client[]).map(normalizeClient)
}

export async function createClient(payload: ClientInsert): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select(CLIENT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeClient(data as Client)
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select(CLIENT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeClient(data as Client)
}

export async function setClientArchived(id: string, isArchived: boolean): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({ is_archived: isArchived })
    .eq('id', id)
    .select(CLIENT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeClient(data as Client)
}

export async function uploadClientLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() ?? 'png'
  const filePath = `client-logos/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('brand-logos')
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('brand-logos').getPublicUrl(filePath)
  return normalizePublicLogoUrl(data.publicUrl) ?? data.publicUrl
}
