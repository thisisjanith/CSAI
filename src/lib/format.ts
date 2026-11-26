import type { EnrollmentStatus, PaymentStatus } from './types'

const lkr = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })
export const formatLKR = (n: number) => lkr.format(n).replace(/LKR\s*/, 'LKR ')

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export function relativeFromNow(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  if (mins < 1) return 'now'
  const unit = mins < 60 ? `${mins} min` : mins < 60 * 24 ? `${Math.round(mins / 60)} hr` : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) > 1 ? 's' : ''}`
  return diff > 0 ? `in ${unit}` : `${unit} ago`
}

/** Short human-friendly code students put in the bank transfer reference. */
export const paymentRef = (enrollmentId: string) => `CSAI-${enrollmentId.replace(/-/g, '').slice(0, 6).toUpperCase()}`

export const enrollmentStatusMeta: Record<EnrollmentStatus, { label: string; cls: string }> = {
  pending_payment: { label: 'Awaiting payment', cls: 'bg-amber-400/15 text-amber-300' },
  pending_verification: { label: 'Verifying payment', cls: 'bg-sky-400/15 text-sky-300' },
  active: { label: 'Active', cls: 'bg-emerald-400/15 text-emerald-300' },
  rejected: { label: 'Payment rejected', cls: 'bg-rose-400/15 text-rose-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-white/10 text-white/60' },
}

export const paymentStatusMeta: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending review', cls: 'bg-sky-400/15 text-sky-300' },
  approved: { label: 'Approved', cls: 'bg-emerald-400/15 text-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-rose-400/15 text-rose-300' },
}

export function initials(name?: string | null, email?: string | null) {
  const src = (name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase()
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function sessionState(starts_at: string, duration: number, joinWindowMin: number, now = Date.now()) {
  const start = new Date(starts_at).getTime()
  const end = start + duration * 60000
  if (now >= end) return 'ended' as const
  if (now >= start) return 'live' as const
  if (now >= start - joinWindowMin * 60000) return 'open' as const
  return 'upcoming' as const
}
