export interface Client {
  id: string
  name: string
  logo_url: string | null
  industry: string | null
  description: string | null
  value_proposition: string | null
  brand_voice: string | null
  content_pillars: string | null
  gdrive_link: string | null
  design_link: string | null
  pic_name: string | null
  pic_whatsapp: string | null
  brand_guideline_link: string | null
  is_archived: boolean
  created_at: string
}

export type ClientInsert = {
  name: string
  logo_url?: string | null
  industry?: string | null
  description?: string | null
  value_proposition?: string | null
  brand_voice?: string | null
  content_pillars?: string | null
  gdrive_link?: string | null
  design_link?: string | null
  pic_name?: string | null
  pic_whatsapp?: string | null
  brand_guideline_link?: string | null
}

export type ClientUpdate = Partial<ClientInsert>
