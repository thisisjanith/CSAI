import { useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { ArrowLeftRight, Globe, LogOut } from 'lucide-react'
import Logo from '../Logo'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../lib/format'

export interface NavItem {
  to: string
  label: string
  short?: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

export default function DashboardShell({ nav, area }: { nav: NavItem[]; area: 'student' | 'admin' }) {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const doSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const avatar = profile?.avatar_url ? (
    <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full object-cover" />
  ) : (
    <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-violet text-xs font-bold text-ink-950">
      {initials(profile?.full_name, user?.email)}
    </span>
  )

  const switchLink = isAdmin
    ? area === 'admin'
      ? { to: '/dashboard', label: 'Student view' }
      : { to: '/admin', label: 'Admin panel' }
    : null

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-white/5 bg-ink-900/70 p-5 lg:flex">
        <Logo to={area === 'admin' ? '/admin' : '/dashboard'} />
        {area === 'admin' && <p className="mt-2 text-xs font-semibold tracking-widest text-brand-gold uppercase">Admin</p>}
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/8 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <n.icon className="size-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/5 pt-4">
          {switchLink && (
            <Link to={switchLink.to} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white">
              <ArrowLeftRight className="size-5" /> {switchLink.label}
            </Link>
          )}
          <Link to="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <Globe className="size-5" /> Back to website
          </Link>
          <button onClick={doSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <LogOut className="size-5" /> Sign out
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile?.full_name || 'Student'}</p>
              <p className="truncate text-xs text-white/50">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <div className="container-x flex h-14 items-center justify-between">
          <Logo to={area === 'admin' ? '/admin' : '/dashboard'} />
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu" aria-expanded={menuOpen} className="rounded-full">
            {avatar}
          </button>
        </div>
        {menuOpen && (
          <>
            <button aria-label="Close menu" className="fixed inset-0 top-14 z-0 cursor-default" onClick={() => setMenuOpen(false)} />
            <div className="card absolute top-full right-4 z-10 mt-2 w-64 p-2 shadow-2xl">
              <div className="border-b border-white/5 px-3 py-2.5">
                <p className="truncate text-sm font-semibold">{profile?.full_name || 'Student'}</p>
                <p className="truncate text-xs text-white/50">{user?.email}</p>
              </div>
              {switchLink && (
                <Link onClick={() => setMenuOpen(false)} to={switchLink.to} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/5">
                  <ArrowLeftRight className="size-4" /> {switchLink.label}
                </Link>
              )}
              <Link onClick={() => setMenuOpen(false)} to="/" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/5">
                <Globe className="size-4" /> Back to website
              </Link>
              <button onClick={doSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-rose-300 hover:bg-white/5">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </header>

      <main className="min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-10">
        <div className="container-x max-w-6xl py-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink-950/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-brand-cyan' : 'text-white/50'
                  }`
                }
              >
                <n.icon className="size-[22px]" />
                {n.short ?? n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-white/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/5">
        <Icon className="size-7 text-white/50" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-white/55">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
