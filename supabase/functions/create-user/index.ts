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
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const password = typeof payload?.password === 'string' ? payload.password.trim() : ''
    const role = readRole(payload?.role)

    if (!email || !password || !role) {
      return jsonResponse({ error: 'Invalid payload: email, password, and role are required.' }, 400)
    }

    const adminClient = createClient(projectUrl(), serviceRoleKey())
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    })
    if (error || !data.user) {
      return jsonResponse({ error: error?.message ?? 'Failed to create user.' }, 400)
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
    return jsonResponse({ error: 'Unexpected error while creating user.' }, 500)
  }
})
