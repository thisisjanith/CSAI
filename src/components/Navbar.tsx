import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { LayoutDashboard, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { initials } from '../lib/format'

const links = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/#how', label: 'How it works' },
  { to: '/#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, profile, isAdmin } = useAuth()
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname, location.hash])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open])

  const dashTo = isAdmin ? '/admin' : '/dashboard'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        scrolled || open ? 'border-b border-white/5 bg-ink-950/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between md:h-18">
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:text-white ${
                    isActive && !l.to.includes('#') ? 'text-white' : 'text-white/65'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to={dashTo} className="btn btn-ghost btn-sm">
              <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-violet text-[10px] font-bold text-ink-950">
                {initials(profile?.full_name, user.email)}
              </span>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signin" className="btn btn-sm text-white/80 hover:text-white">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="-mr-2 grid size-11 place-items-center rounded-xl text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] bottom-0 bg-ink-950/97 backdrop-blur-xl transition-all duration-300 md:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="container-x flex h-full flex-col pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <ul className="flex flex-col">
            {links.map((l, i) => (
              <li
                key={l.to}
                style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
                className={`transition-all duration-300 ${open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
              >
                <Link to={l.to} className="flex min-h-14 items-center border-b border-white/5 font-display text-2xl font-semibold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <Link to={dashTo} className="btn btn-primary w-full">
                <LayoutDashboard className="size-4" /> Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary w-full">
                  Create free account
                </Link>
                <Link to="/signin" className="btn btn-ghost w-full">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
