import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from '../../components/dashboard/DashboardShell'
import { PasswordInput } from '../auth/AuthShell'
import { initials } from '../../lib/format'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '', city: '' })
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const isGoogle = user?.app_metadata?.provider === 'google'

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '', city: profile.city ?? '' })
  }, [profile])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null, city: form.city.trim() || null })
      .eq('id', user.id)
    setBusy(false)
    if (error) return toast.error(error.message)
    await refreshProfile()
    toast.success('Profile saved')
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters.')
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPwBusy(false)
    if (error) return toast.error(error.message)
    setPassword('')
    toast.success('Password updated')
  }

  return (
    <>
      <PageHeader title="My profile" subtitle="Keep your details up to date so we can reach you" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <form onSubmit={save} className="card p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" className="size-16 rounded-full object-cover" />
            ) : (
              <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-violet text-lg font-bold text-ink-950">
                {initials(profile?.full_name, user?.email)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile?.full_name || 'Student'}</p>
              <p className="truncate text-sm text-white/55">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className="label">Full name</label>
              <input id="full_name" className="input" autoComplete="name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="phone" className="label">Mobile / WhatsApp</label>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder="07X XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label htmlFor="city" className="label">City</label>
              <input id="city" className="input" autoComplete="address-level2" placeholder="Colombo" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full sm:w-auto">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={changePassword} className="card h-fit p-5 sm:p-6">
          <h2 className="font-bold">{isGoogle ? 'Set a password' : 'Change password'}</h2>
          <p className="mt-1 text-sm text-white/55">
            {isGoogle ? 'You sign in with Google. Optionally add a password to also sign in with email.' : 'Use at least 8 characters.'}
          </p>
          <div className="mt-4">
            <PasswordInput autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={pwBusy || !password} className="btn btn-ghost mt-4 w-full">
            {pwBusy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </>
  )
}
