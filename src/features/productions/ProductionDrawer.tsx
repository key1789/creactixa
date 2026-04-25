import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ProductionDetailView } from './ProductionDetailView'
import { ProductionEditForm } from './ProductionEditForm'
import type { Production, ProductionTab, ProductionUpdate } from './types'

type DrawerMode = 'view' | 'edit'

interface ProductionDrawerProps {
  production: Production | null
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onSave: (payload: ProductionUpdate) => Promise<void>
}

const tabs: ProductionTab[] = ['SCRIPT', 'NEEDS', 'SCHEDULE']

export function ProductionDrawer({
  production,
  open,
  isSubmitting,
  onClose,
  onSave,
}: ProductionDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>('view')
  const [tab, setTab] = useState<ProductionTab>('SCRIPT')
  const drawerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const container = drawerRef.current
      if (!container) return
      const focusable = getFocusableElements(container)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.requestAnimationFrame(() => {
      const container = drawerRef.current
      if (!container) return
      const firstFocusable = getFocusableElements(container)[0]
      firstFocusable?.focus()
    })

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      previousFocusRef.current?.focus()
    }
  }, [open, onClose])

  async function handleGenerateClientLink() {
    if (!production) return
    const url = `${window.location.origin}/view/${production.id}`
    await navigator.clipboard.writeText(url)
  }

  return (
    <AnimatePresence>
      {open && production && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={drawerRef}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="production-drawer-title"
            aria-describedby="production-drawer-description"
            tabIndex={-1}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="production-drawer-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {production.title}
                </h2>
                <p id="production-drawer-description" className="text-sm text-slate-500 dark:text-slate-400">
                  {production.clients?.name ?? '-'}
                </p>
              </div>
              <button onClick={onClose} className="app-button-secondary px-3 py-1.5">
                Tutup
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setMode('view')}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  mode === 'view'
                    ? 'bg-slate-900 text-white dark:bg-brand-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                View
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  mode === 'edit'
                    ? 'bg-slate-900 text-white dark:bg-brand-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Edit
              </button>
            </div>

            <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {tabs.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    tab === item
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {mode === 'view' ? (
              <ProductionDetailView
                production={production}
                activeTab={tab}
                onGenerateClientLink={handleGenerateClientLink}
              />
            ) : (
              <ProductionEditForm
                production={production}
                activeTab={tab}
                isSubmitting={isSubmitting}
                onSubmit={onSave}
              />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}
