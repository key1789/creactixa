import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type UserRole = 'admin' | 'planner' | 'production' | 'viewer'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'planner' || value === 'production' || value === 'viewer'
}

export function readRole(input: unknown): UserRole | null {
  return isUserRole(input) ? input : null
}

export function projectUrl(): string {
  return requiredEnv('PROJECT_URL')
}

export function anonKey(): string {
  return requiredEnv('SUPABASE_ANON_KEY')
}

export function serviceRoleKey(): string {
  return requiredEnv('SERVICE_ROLE_KEY')
}

export async function assertAdmin(authHeader: string | null): Promise<void> {
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const client = createClient(projectUrl(), anonKey(), {
    global: { headers: { Authorization: authHeader } },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized user.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const role = readRole(data.user.app_metadata?.role)
  if (role !== 'admin') {
    throw new Response(JSON.stringify({ error: 'Forbidden: admin only.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
