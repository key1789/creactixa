import { NavLink } from 'react-router-dom'
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

export function Sidebar() {
  const { user } = useAuth()
  const canManageUsers = can(user, 'users.manage')
  const visibleItems = navItems.filter((item) => !item.adminOnly || canManageUsers)

  return (
    <aside className="hidden w-72 border-r border-slate-200/80 bg-white/90 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 md:block">
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
    </aside>
  )
}
