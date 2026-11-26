import { Link } from 'react-router'

export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="csai-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset=".55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f5b83d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0a0c1a" />
      <path d="M32 10 51 21v22L32 54 13 43V21z" fill="none" stroke="url(#csai-g)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="6" fill="url(#csai-g)" />
      <path d="M32 26V16M37 35l9 5M27 35l-9 5" stroke="url(#csai-g)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="CSAI home">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight">CSAI</span>
        <span className="hidden text-[10px] tracking-wide text-white/50 sm:block">Ceylon School of AI</span>
      </span>
    </Link>
  )
}
