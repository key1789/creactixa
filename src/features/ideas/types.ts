export type IdeaStatus = 'INBOX' | 'APPROVED' | 'REVISION'

export interface Idea {
  id: string
  client_id: string
  title: string
  description: string | null
  format: string | null
  reference_link: string | null
  funnel_stage: string | null
  content_pillar: string | null
  status: IdeaStatus
  created_at: string
  clients?: {
    name: string
  } | null
}

export type IdeaInsert = {
  client_id: string
  title: string
  description?: string | null
  format?: string | null
  reference_link?: string | null
  funnel_stage?: string | null
  content_pillar?: string | null
  status?: IdeaStatus
}

export type IdeaUpdate = Partial<IdeaInsert>

export interface ActiveClientOption {
  id: string
  name: string
}
