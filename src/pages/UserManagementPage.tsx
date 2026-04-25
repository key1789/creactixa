import { useEffect, useState } from 'react'
import { can } from '../features/auth/permissions'
import type { UserRole } from '../features/auth/types'
import { useAuth } from '../features/auth/useAuth'
import { logActivity } from '../services/activityLogService'
import {
  createManagedUser,
  listManagedUsers,
  type ManagedUser,
  updateManagedUserRole,
} from '../services/userManagementService'

const ROLE_OPTIONS: UserRole[] = ['admin', 'planner', 'production', 'viewer']

export function UserManagementPage() {
  const { user } = useAuth()
  const canManageUsers = can(user, 'users.manage')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!canManageUsers) return

    let active = true
    async function loadUsers() {
      try {
        const data = await listManagedUsers()
        if (!active) return
        setUsers(data)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar user.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadUsers()
    return () => {
      active = false
    }
  }, [canManageUsers])

  async function handleCreateUser() {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const created = await createManagedUser({ email, password, role })
      setUsers((prev) => [created, ...prev])
      setEmail('')
      setPassword('')
      setRole('viewer')
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: 'user.created',
        entity: 'auth',
        entityId: created.id,
        details: { email: created.email, role: created.role },
      })
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal membuat user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateRole(targetUser: ManagedUser, nextRole: UserRole) {
    setError(null)
    try {
      const updated = await updateManagedUserRole({ userId: targetUser.id, role: nextRole })
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      await logActivity({
        actorId: user?.id,
        actorEmail: user?.email,
        action: 'user.role_updated',
        entity: 'auth',
        entityId: updated.id,
        details: { email: updated.email, role: updated.role },
      })
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Gagal memperbarui role user.')
    }
  }

  if (!canManageUsers) {
    return (
      <section className="space-y-4">
        <div className="app-card p-5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Akses ditolak. Hanya admin yang dapat mengelola user.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-busy={loading} aria-labelledby="user-management-title">
      <div className="app-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Admin</p>
        <h1 id="user-management-title" className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          User Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tambah user baru dan kelola role akses aplikasi.
        </p>
      </div>

      <div className="app-card grid grid-cols-1 gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="app-input"
          placeholder="email@domain.com"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="app-input"
          placeholder="Password sementara"
        />
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="app-input">
          {ROLE_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button onClick={() => void handleCreateUser()} className="app-button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Tambah User'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="app-card p-4">
          <div className="app-skeleton h-44 border-0" />
        </div>
      ) : (
        <div className="app-card overflow-x-auto p-2">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{item.email ?? '-'}</td>
                  <td className="px-3 py-2">
                    <select
                      value={item.role}
                      onChange={(event) => void handleUpdateRole(item, event.target.value as UserRole)}
                      className="app-input max-w-[180px]"
                    >
                      {ROLE_OPTIONS.map((roleItem) => (
                        <option key={roleItem} value={roleItem}>
                          {roleItem}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={3} className="px-3 py-8">
                    <div className="app-empty-state py-6">Belum ada user terdaftar.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
