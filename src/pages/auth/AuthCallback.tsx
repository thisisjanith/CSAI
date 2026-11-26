import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import { safeNext } from './AuthShell'
import Spinner from '../../components/Spinner'

/** Landing page for Google OAuth and email-confirmation links. */
export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(params.get('error_description'))
  const next = safeNext(params.get('next'))

  useEffect(() => {
    if (error) return
    let done = false
    const finish = () => {
      if (done) return
      done = true
      navigate(next, { replace: true })
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish()
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish()
    })
    const t = setTimeout(() => {
      if (!done) setError('Sign-in took too long. Please try again.')
    }, 12000)
    return () => {
      clearTimeout(t)
      sub.subscription.unsubscribe()
    }
  }, [error, navigate, next])

  return (
    <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
      {error ? (
        <div>
          <p className="text-lg font-semibold">We could not sign you in</p>
          <p className="mt-2 text-white/60">{error}</p>
          <Link to="/signin" className="btn btn-primary mt-6">Try again</Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-white/70">
          <Spinner className="size-8" /> Signing you in…
        </div>
      )}
    </div>
  )
}
