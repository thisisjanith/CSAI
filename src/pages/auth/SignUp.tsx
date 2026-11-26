import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import AuthShell, { Divider, GoogleButton, PasswordInput, safeNext } from './AuthShell'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function SignUp() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (!loading && user) return <Navigate to={next} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters.')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setBusy(false)
    if (error) return toast.error(error.message)
    if (data.session) {
      toast.success('Account created. Welcome to CSAI!')
      navigate(next, { replace: true })
    } else {
      setSentTo(email.trim())
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={<Link to="/signin" className="font-semibold text-brand-cyan">Back to sign in</Link>}>
        <div className="text-center">
          <MailCheck className="mx-auto size-14 text-brand-cyan" />
          <p className="mt-4 text-white/70">
            We sent a confirmation link to <strong className="text-white">{sentTo}</strong>. Tap it to activate your account.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to join. Takes 30 seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/signin?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-cyan">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton next={next} label="Sign up with Google" />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" autoComplete="name" required className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
