import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { toast } from 'sonner'

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null, fallback = '/dashboard') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-violet/20 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/10 blur-[100px]" />
      </div>
      <div className="relative w-full max-w-[420px]">
        <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-2.5" aria-label="CSAI home">
          <LogoMark className="size-11" />
        </Link>
        <div className="sm:card sm:p-8">
          <h1 className="text-center text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-center text-white/60">{subtitle}</p>}
          {!isSupabaseConfigured && (
            <div className="mt-6 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
              <AlertTriangle className="size-5 shrink-0" />
              <p>Accounts aren't connected yet. Add your Supabase keys to <code>.env</code> (see README).</p>
            </div>
          )}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-white/60">{footer}</div>}
      </div>
    </div>
  )
}

export function GoogleButton({ next, label = 'Continue with Google' }: { next: string; label?: string }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      toast.error(error.message)
      setBusy(false)
    }
  }
  return (
    <button type="button" onClick={go} disabled={busy || !isSupabaseConfigured} className="btn w-full border border-white/15 bg-white text-[#1f1f1f] hover:bg-white/90">
      <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {busy ? 'Redirecting…' : label}
    </button>
  )
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-white/40">
      <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className="input pr-12" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/50 hover:text-white"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}
