import type { User } from '@supabase/supabase-js'
import type { UserRole } from './types'

export type PermissionAction =
  | 'clients.create'
  | 'clients.edit'
  | 'clients.archive'
  | 'ideas.create'
  | 'ideas.edit'
  | 'ideas.approve'
  | 'productions.edit'
  | 'productions.drag'

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'clients.create',
    'clients.edit',
    'clients.archive',
    'ideas.create',
    'ideas.edit',
    'ideas.approve',
    'productions.edit',
    'productions.drag',
  ],
  planner: ['clients.create', 'clients.edit', 'ideas.create', 'ideas.edit', 'ideas.approve'],
  production: ['productions.edit', 'productions.drag'],
  viewer: [],
}

export function getUserRole(user: User | null): UserRole {
  const rawRole = user?.app_metadata?.role
  if (rawRole === 'admin' || rawRole === 'planner' || rawRole === 'production' || rawRole === 'viewer') {
    return rawRole
  }
  return 'viewer'
}

export function can(user: User | null, action: PermissionAction): boolean {
  const role = getUserRole(user)
  return ROLE_PERMISSIONS[role].includes(action)
}
