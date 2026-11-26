import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, CalendarDays, Clock, Users, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/dashboard/DashboardShell'
import { PageLoader } from '../../components/Spinner'
import { formatDateTime, formatLKR, paymentRef } from '../../lib/format'
import type { Payment, Session } from '../../lib/types'

interface Stats {
  students: number
  active: number
  pending: number
  revenue: number
  recentPending: Payment[]
  nextSessions: Session[]
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const nowIso = new Date().toISOString()
    const weekIso = new Date(Date.now() + 7 * 86400000).toISOString()
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('payments')
        .select('*, course:courses(title), profile:profiles!payments_user_id_fkey(full_name, email)', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at')
        .limit(5),
      supabase.from('payments').select('amount_lkr').eq('status', 'approved'),
      supabase.from('sessions').select('*, course:courses(title)').gte('starts_at', nowIso).lte('starts_at', weekIso).order('starts_at').limit(5),
    ]).then(([students, active, pending, approved, sessions]) => {
      setStats({
        students: students.count ?? 0,
        active: active.count ?? 0,
        pending: pending.count ?? 0,
        revenue: (approved.data ?? []).reduce((s, p) => s + (p.amount_lkr ?? 0), 0),
        recentPending: (pending.data as Payment[]) ?? [],
        nextSessions: (sessions.data as Session[]) ?? [],
      })
    })
  }, [])

  if (!stats) return <PageLoader />

  const tiles = [
    { label: 'Students', value: stats.students.toLocaleString(), icon: Users, to: '/admin/students' },
    { label: 'Active enrollments', value: stats.active.toLocaleString(), icon: BadgeCheck, to: '/admin/students' },
    { label: 'Pending payments', value: stats.pending.toLocaleString(), icon: Clock, to: '/admin/payments', alert: stats.pending > 0 },
    { label: 'Revenue (approved)', value: formatLKR(stats.revenue), icon: Wallet, to: '/admin/payments' },
  ]

  return (
    <>
      <PageHeader title="Admin overview" subtitle="Everything that needs your attention" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className={`card p-4 transition-colors hover:border-white/15 sm:p-5 ${t.alert ? 'border-amber-400/40' : ''}`}>
            <t.icon className={`size-5 ${t.alert ? 'text-amber-300' : 'text-brand-cyan'}`} />
            <p className="mt-3 font-display text-xl font-bold sm:text-2xl">{t.value}</p>
            <p className="text-xs text-white/55 sm:text-sm">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Payments to review</h2>
            <Link to="/admin/payments" className="text-sm font-medium text-brand-cyan">Review all</Link>
          </div>
          <div className="card divide-y divide-white/5">
            {stats.recentPending.length === 0 && <p className="p-5 text-sm text-white/50">All caught up 🎉</p>}
            {stats.recentPending.map((p) => (
              <Link key={p.id} to="/admin/payments" className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.profile?.full_name || p.profile?.email}</p>
                  <p className="truncate text-xs text-white/50">{p.course?.title} · {paymentRef(p.enrollment_id)}</p>
                </div>
                <span className="shrink-0 font-semibold">{formatLKR(p.amount_lkr)}</span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Classes this week</h2>
            <Link to="/admin/sessions" className="text-sm font-medium text-brand-cyan">Schedule</Link>
          </div>
          <div className="card divide-y divide-white/5">
            {stats.nextSessions.length === 0 && (
              <div className="flex items-center justify-between p-5 text-sm text-white/50">
                No classes scheduled
                <Link to="/admin/sessions" className="inline-flex items-center gap-1 text-brand-cyan">Add <ArrowRight className="size-4" /></Link>
              </div>
            )}
            {stats.nextSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <CalendarDays className="size-5 shrink-0 text-white/40" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="truncate text-xs text-white/50">{s.course?.title} · {formatDateTime(s.starts_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
