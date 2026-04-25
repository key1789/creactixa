import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function MainLayout() {
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const showInspectorToggle = location.pathname.startsWith('/productions')

  function toggleNav() {
    setIsNavOpen((prev) => !prev)
  }

  function closeNav() {
    setIsNavOpen(false)
  }

  function handleInspectorToggle() {
    window.dispatchEvent(new CustomEvent('workspace-toggle-inspector'))
  }

  return (
    <div className="workspace-shell flex min-h-screen bg-transparent">
      <CommandPalette />
      <Sidebar isOpen={isNavOpen} onClose={closeNav} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          onToggleNav={toggleNav}
          onToggleInspector={handleInspectorToggle}
          showInspectorToggle={showInspectorToggle}
        />
        <main className="flex-1 px-3 pb-4 pt-3 md:px-4 md:pb-6 md:pt-4 lg:px-6 xl:px-7">
          <div className="mx-auto w-full max-w-[1680px]">
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
