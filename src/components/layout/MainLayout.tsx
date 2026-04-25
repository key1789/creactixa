import { Outlet, useLocation } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-transparent">
      <CommandPalette />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-6 pt-4 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px]">
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
