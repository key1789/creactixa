import type { UserRole } from '../features/auth/types'
import { supabase } from './supabase'

export interface ManagedUser {
  id: string
  email: string | null
  role: UserRole
  created_at: string
}

interface FunctionError {
  error?: string
}

function normalizeFunctionError(payload: unknown, fallback: string): Error {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as FunctionError).error
    if (typeof value === 'string' && value.trim()) {
      return new Error(value)
    }
  }
  return new Error(fallback)
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const { data, error } = await supabase.functions.invoke('list-users', { method: 'GET' })
  if (error) throw new Error(error.message)
  if (!data || !Array.isArray(data.users)) {
    throw normalizeFunctionError(data, 'Failed to list users.')
  }
  return data.users as ManagedUser[]
}

export async function createManagedUser(input: {
  email: string
  password: string
  role: UserRole
}): Promise<ManagedUser> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: input,
  })
  if (error) throw new Error(error.message)
  if (!data || !data.user) {
    throw normalizeFunctionError(data, 'Failed to create user.')
  }
  return data.user as ManagedUser
}

export async function updateManagedUserRole(input: {
  userId: string
  role: UserRole
}): Promise<ManagedUser> {
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: input,
  })
  if (error) throw new Error(error.message)
  if (!data || !data.user) {
    throw normalizeFunctionError(data, 'Failed to update user role.')
  }
  return data.user as ManagedUser
}
