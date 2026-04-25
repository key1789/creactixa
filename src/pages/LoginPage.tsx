import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signInWithPassword } from '../features/auth/authService'
import { useAuth } from '../features/auth/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  if (!loading && user) {
    return <Navigate to={fromPath} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signInWithPassword(email.trim(), password)
      navigate(fromPath, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="app-card w-full max-w-md space-y-5 p-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">CREACTIXA</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Login untuk mengakses workspace internal.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="app-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@creactixa.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
              htmlFor="login-password"
            >
              Password
            </label>
            <input
              id="login-password"
              className="app-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="app-button-primary w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
