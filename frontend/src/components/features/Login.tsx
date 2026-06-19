import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LuSparkles, LuLoader } from 'react-icons/lu'
import { useAuth } from '../../context/AuthContext'

type Mode = 'login' | 'signup'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading, login, register, loginAsDemo } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // Already authenticated → skip the login page.
  if (!loading && user) return <Navigate to="/dashboard" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const handleDemo = async () => {
    setError(null)
    setDemoLoading(true)
    try {
      await loginAsDemo()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo is unavailable')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() })
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl text-[14px] bg-white/70 border border-white/60 ' +
    'outline-none focus:border-clio-primary/40 focus:bg-white transition-colors text-gray-800 placeholder:text-gray-400'

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-95 h-150 rounded-2xl p-7 flex flex-col gap-5 bg-clio-glass border border-clio-glass-border backdrop-blur-xl shadow-lg">

        {/* Logo / heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-clio-primary text-clio-primary-foreground">
            <LuSparkles />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-clio-primary leading-tight">Clio</h1>
            <p className="text-[13px] text-clio-muted-foreground">
              {mode === 'login' ? 'Welcome back — sign in to continue' : 'Create your account'}
            </p>
          </div>
        </div>

        {/* Mode toggle — segmented control with a sliding highlight */}
        <div className="relative flex w-full p-1 rounded-xl bg-gray-200 border border-gray-300 text-[13px]">
          {/* Sliding highlight: same width as one button, translates between the two */}
          <span
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-gray-900 shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
          />
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`relative z-10 flex-1 py-1.5 rounded-lg font-medium transition-colors duration-200 ${mode === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`relative z-10 flex-1 py-1.5 rounded-lg font-medium transition-colors duration-200 ${mode === 'signup' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
              <input
                className={inputClass}
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
          )}

          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <input
            className={inputClass}
            type="password"
            placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />

          {error && (
            <p className="text-[12px] text-red-500 -my-0.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || demoLoading}
            className="mt-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium
              bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting
              ? <><LuLoader size={15} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <div className="flex-1 h-px bg-gray-300" />
          or
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* One-click demo — signs into the shared demo account with seeded data */}
        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading || submitting}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium
            bg-[#007bff] text-white hover:bg-[#006ae0] transition-colors disabled:opacity-50"
        >
          {demoLoading
            ? <><LuLoader size={15} className="animate-spin" /> Loading demo…</>
            : 'View Demo'}
        </button>

        <p className="text-center text-[12px] text-clio-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-clio-primary font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
