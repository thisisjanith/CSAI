import { Link } from 'react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useStudentData } from '../../hooks/useStudentData'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import CourseIcon from '../../components/CourseIcon'
import { PageLoader } from '../../components/Spinner'
import { enrollmentStatusMeta, formatDate } from '../../lib/format'

export default function MyCourses() {
  const { enrollments, sessions, loading } = useStudentData()
  if (loading) return <PageLoader />

  return (
    <>
      <PageHeader
        title="My courses"
        subtitle="Your enrollments and their status"
        action={<Link to="/courses" className="btn btn-ghost btn-sm self-start">Browse more courses</Link>}
      />
      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          text="Enroll in a program to see it here."
          action={<Link to="/courses" className="btn btn-primary">Browse courses <ArrowRight className="size-4" /></Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((e) => {
            const meta = enrollmentStatusMeta[e.status]
            const courseSessions = sessions.filter((s) => s.course_id === e.course_id)
            const done = courseSessions.filter((s) => new Date(s.starts_at).getTime() < Date.now()).length
            return (
              <div key={e.id} className="card flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/8">
                    <CourseIcon kind={e.course?.icon} className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold">{e.course?.title}</h2>
                    <span className={`badge mt-1.5 ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
                {e.status === 'active' && courseSessions.length > 0 && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-white/55">
                      <span>Progress</span>
                      <span>{done}/{courseSessions.length} sessions</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-violet" style={{ width: `${(done / courseSessions.length) * 100}%` }} />
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs text-white/45">
                  {e.activated_at ? `Active since ${formatDate(e.activated_at)}` : `Requested ${formatDate(e.created_at)}`}
                </p>
                <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                  {e.status === 'active' ? (
                    <Link to="/dashboard/schedule" className="btn btn-primary btn-sm flex-1">Class schedule</Link>
                  ) : e.status === 'pending_verification' ? (
                    <Link to="/dashboard/payments" className="btn btn-ghost btn-sm flex-1">View payment</Link>
                  ) : (
                    <Link to={`/dashboard/checkout/${e.course?.slug}`} className="btn btn-gold btn-sm flex-1">
                      {e.status === 'rejected' ? 'Resubmit payment' : 'Complete payment'}
                    </Link>
                  )}
                  <Link to={`/courses/${e.course?.slug}`} className="btn btn-ghost btn-sm">Details</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
