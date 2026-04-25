import { NavLink, useNavigate } from 'react-router-dom'
import { can } from '../../features/auth/permissions'
import { useAuth } from '../../features/auth/useAuth'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Clients', path: '/clients' },
  { label: 'Content Planning', path: '/content-planning' },
  { label: 'Productions', path: '/productions' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Activity Log', path: '/activity-log' },
  { label: 'User Management', path: '/users', adminOnly: true },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const canManageUsers = can(user, 'users.manage')
  const visibleItems = navItems.filter((item) => !item.adminOnly || canManageUsers)

  async function handleSignOut() {
    const confirmed = window.confirm('Yakin ingin keluar dari akun ini?')
    if (!confirmed) return
    await signOut()
    onClose()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
          aria-label="Tutup navigasi"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200/80 bg-white/95 p-5 backdrop-blur transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900/92 md:static md:z-auto md:h-auto md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
      <div>
        <div className="app-card mb-7 p-4">
          <p className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.24em] text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800">
            CREACTIXA
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Workspace operasional editorial</p>
        </div>

        <nav className="space-y-1.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'group block rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                ].join(' ')
              }
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 opacity-0 transition-opacity group-hover:opacity-100" />
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => void handleSignOut()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 7L20 12L15 17" />
            <path d="M20 12H9" />
            <path d="M11 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H11" />
          </svg>
          Keluar
        </button>
      </div>
      </aside>
    </>
  )
}
