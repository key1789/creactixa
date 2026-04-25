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
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  try {
    await assertAdmin(req.headers.get('Authorization'))

    const payload = await req.json()
    const userId = typeof payload?.userId === 'string' ? payload.userId : ''
    const role = readRole(payload?.role)
    if (!userId || !role) {
      return jsonResponse({ error: 'Invalid payload: userId and role are required.' }, 400)
    }

    const adminClient = createClient(projectUrl(), serviceRoleKey())
    const fetched = await adminClient.auth.admin.getUserById(userId)
    if (fetched.error || !fetched.data.user) {
      return jsonResponse({ error: fetched.error?.message ?? 'User not found.' }, 404)
    }

    const currentMetadata = fetched.data.user.app_metadata ?? {}
    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { ...currentMetadata, role },
    })
    if (error || !data.user) {
      return jsonResponse({ error: error?.message ?? 'Failed to update role.' }, 400)
    }

    return jsonResponse({
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        role: readRole(data.user.app_metadata?.role) ?? 'viewer',
        created_at: data.user.created_at,
      },
    })
  } catch (responseOrError) {
    if (responseOrError instanceof Response) return responseOrError
    return jsonResponse({ error: 'Unexpected error while updating role.' }, 500)
  }
})
