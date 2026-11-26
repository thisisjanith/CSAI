import { Link } from 'react-router'
import { ArrowRight, BookOpen, CalendarDays, CreditCard, Video } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useStudentData } from '../../hooks/useStudentData'
import { useNow } from '../../hooks/useNow'
import SessionCard, { JoinButton } from '../../components/dashboard/SessionCard'
import { EmptyState } from '../../components/dashboard/DashboardShell'
import CourseIcon from '../../components/CourseIcon'
import { PageLoader } from '../../components/Spinner'
import { enrollmentStatusMeta, formatDateTime, relativeFromNow } from '../../lib/format'

export default function Overview() {
  const { profile } = useAuth()
  const { enrollments, sessions, loading } = useStudentData()
  const now = useNow(20_000)

  if (loading) return <PageLoader />

  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() + s.duration_minutes * 60000 > now)
  const next = upcoming[0]
  const active = enrollments.filter((e) => e.status === 'active')
  const needsAction = enrollments.filter((e) => e.status === 'pending_payment' || e.status === 'rejected')
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Hi{firstName ? `, ${firstName}` : ''} 👋</h1>
        <p className="mt-1 text-white/60">Here's what's happening with your learning.</p>
      </div>

      {needsAction.map((e) => (
        <div key={e.id} className="flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <CreditCard className="mt-0.5 size-5 shrink-0 text-amber-300" />
            <p className="text-sm text-amber-100">
              {e.status === 'rejected' ? 'Your payment for ' : 'Complete your payment for '}
              <strong>{e.course?.title}</strong>
              {e.status === 'rejected' ? ' was not approved. Please resubmit.' : ' to unlock your classes.'}
            </p>
          </div>
          <Link to={`/dashboard/checkout/${e.course?.slug}`} className="btn btn-gold btn-sm shrink-0">
            {e.status === 'rejected' ? 'Resubmit' : 'Pay now'}
          </Link>
        </div>
      ))}

      {/* Next class */}
      {next ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-violet/25 via-ink-800 to-ink-900 p-5 sm:p-7">
          <div aria-hidden className="absolute -top-16 -right-16 size-56 rounded-full bg-brand-cyan/20 blur-3xl" />
          <p className="relative text-xs font-semibold tracking-widest text-brand-cyan uppercase">Next class · {relativeFromNow(next.starts_at, now)}</p>
          <h2 className="relative mt-2 text-xl font-bold sm:text-2xl">{next.title}</h2>
          <p className="relative mt-1 text-sm text-white/65">{next.course?.title} · {formatDateTime(next.starts_at)}</p>
          <JoinButton session={next} now={now} className="relative mt-5 w-full sm:w-auto" />
        </section>
      ) : active.length > 0 ? (
        <EmptyState icon={CalendarDays} title="No upcoming classes yet" text="Your instructor will schedule sessions soon. They'll appear here with a Zoom link." />
      ) : null}

      {/* Courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">My courses</h2>
          <Link to="/dashboard/courses" className="text-sm font-medium text-brand-cyan">View all</Link>
        </div>
        {enrollments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="You haven't enrolled yet"
            text="Pick a program to get started. Enrollment takes just a minute."
            action={<Link to="/courses" className="btn btn-primary">Browse courses <ArrowRight className="size-4" /></Link>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {enrollments.slice(0, 4).map((e) => (
              <Link key={e.id} to={e.status === 'active' ? '/dashboard/schedule' : `/dashboard/checkout/${e.course?.slug}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-white/15">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/8">
                  <CourseIcon kind={e.course?.icon} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.course?.title}</p>
                  <span className={`badge mt-1 ${enrollmentStatusMeta[e.status].cls}`}>{enrollmentStatusMeta[e.status].label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 1 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Coming up</h2>
            <Link to="/dashboard/schedule" className="text-sm font-medium text-brand-cyan">Full schedule</Link>
          </div>
          <div className="space-y-3">
            {upcoming.slice(1, 4).map((s) => (
              <SessionCard key={s.id} session={s} now={now} />
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && enrollments.length > 0 && needsAction.length === 0 && (
        <EmptyState icon={Video} title="Almost there" text="We're verifying your payment. Your classes will appear here once it's approved." />
      )}
    </div>
  )
}
