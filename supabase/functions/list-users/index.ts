import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  assertAdmin,
  corsHeaders,
  jsonResponse,
  projectUrl,
  readRole,
  serviceRoleKey,
} from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    await assertAdmin(req.headers.get('Authorization'))

    const adminClient = createClient(projectUrl(), serviceRoleKey())
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) return jsonResponse({ error: error.message }, 400)

    const users = (data.users ?? []).map((user) => ({
      id: user.id,
      email: user.email ?? null,
      role: readRole(user.app_metadata?.role) ?? 'viewer',
      created_at: user.created_at,
    }))

    return jsonResponse({ users })
  } catch (responseOrError) {
    if (responseOrError instanceof Response) return responseOrError
    return jsonResponse({ error: 'Unexpected error while listing users.' }, 500)
  }
})
