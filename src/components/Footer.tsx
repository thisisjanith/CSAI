import { Link } from 'react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo'
import { site } from '../lib/config'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-ink-950 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="container-x grid gap-10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-white/55">
            Ceylon School of Artificial Intelligence. Practical, live AI education for everyone in Sri Lanka and beyond.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Programs</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link className="hover:text-white" to="/courses/professional-skills-with-ai">Professional Skills with AI</Link></li>
            <li><Link className="hover:text-white" to="/courses/game-development-with-ai">Game Development with AI</Link></li>
            <li><Link className="hover:text-white" to="/courses/mobile-and-web-app-dev-with-ai">Web & Mobile App Dev with AI</Link></li>
            <li><Link className="hover:text-white" to="/courses/digital-marketing-with-ai">Digital Marketing with AI</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Students</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link className="hover:text-white" to="/signup">Create account</Link></li>
            <li><Link className="hover:text-white" to="/signin">Sign in</Link></li>
            <li><Link className="hover:text-white" to="/dashboard">My dashboard</Link></li>
            <li><Link className="hover:text-white" to="/#faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li className="flex items-center gap-2.5"><Mail className="size-4 shrink-0 text-brand-cyan" /><a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a></li>
            <li className="flex items-center gap-2.5"><Phone className="size-4 shrink-0 text-brand-cyan" /><a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-white">{site.phone}</a></li>
            <li className="flex items-center gap-2.5"><MapPin className="size-4 shrink-0 text-brand-cyan" />{site.address}</li>
          </ul>
        </div>
      </div>
      <div className="container-x mt-12 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p>Made in Sri Lanka 🇱🇰</p>
      </div>
    </footer>
  )
}
