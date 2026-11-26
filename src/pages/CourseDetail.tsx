import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Clock, Signal } from 'lucide-react'
import CourseIcon, { courseAccent } from '../components/CourseIcon'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../context/AuthContext'
import { formatLKR } from '../lib/format'
import { PageLoader } from '../components/Spinner'

export default function CourseDetail() {
  const { slug } = useParams()
  const { courses, loading } = useCourses()
  const { user } = useAuth()
  const navigate = useNavigate()
  const course = courses.find((c) => c.slug === slug)

  if (!course) {
    if (loading) return <PageLoader />
    return (
      <div className="container-x grid min-h-[70dvh] place-items-center pt-24 text-center">
        <div>
          <h1 className="text-3xl font-bold">Course not found</h1>
          <Link to="/courses" className="btn btn-ghost mt-6">Back to courses</Link>
        </div>
      </div>
    )
  }

  const enroll = () => {
    const target = `/dashboard/checkout/${course.slug}`
    navigate(user ? target : `/signup?next=${encodeURIComponent(target)}`)
  }

  const accent = courseAccent[course.icon ?? ''] ?? 'from-white/10 to-transparent'

  return (
    <article className="relative pt-[calc(6rem+env(safe-area-inset-top))] pb-32 lg:pb-24">
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b ${accent} opacity-50 [mask-image:linear-gradient(#000,transparent)]`} />
      <div className="container-x relative">
        <Link to="/courses" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="size-4" /> All courses
        </Link>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="grid size-14 place-items-center rounded-2xl bg-white/8 ring-1 ring-white/10">
              <CourseIcon kind={course.icon} className="size-7" />
            </span>
            <h1 className="mt-5 text-4xl font-bold text-balance sm:text-5xl">{course.title}</h1>
            <p className="mt-4 text-lg text-white/70">{course.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {course.duration && <span className="flex items-center gap-2"><Clock className="size-4 text-brand-cyan" />{course.duration}</span>}
              {course.level && <span className="flex items-center gap-2"><Signal className="size-4 text-brand-cyan" />{course.level}</span>}
            </div>

            {course.description && <p className="mt-8 leading-relaxed text-white/75">{course.description}</p>}

            {course.highlights.length > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl font-bold">What you'll learn</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.highlights.map((h) => (
                    <li key={h} className="card flex items-start gap-3 p-4 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {course.outline.length > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl font-bold">Course outline</h2>
                <ol className="mt-5 space-y-3">
                  {course.outline.map((m, i) => (
                    <li key={m.title} className="card p-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/8 text-sm font-bold text-brand-gold">{i + 1}</span>
                        <h3 className="font-bold">{m.title}</h3>
                      </div>
                      <ul className="mt-3 space-y-1.5 pl-11 text-sm text-white/65">
                        {m.topics.map((t) => (
                          <li key={t} className="list-disc">{t}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Desktop enroll card */}
          <aside className="hidden lg:block">
            <div className="card sticky top-24 p-6">
              <p className="text-sm text-white/60">Course fee</p>
              <p className="mt-1 font-display text-4xl font-bold">{formatLKR(course.price_lkr)}</p>
              <button onClick={enroll} className="btn btn-primary mt-6 w-full">
                Enroll now <ArrowRight className="size-4" />
              </button>
              <ul className="mt-6 space-y-2.5 text-sm text-white/65">
                <li className="flex gap-2"><Check className="size-4 text-emerald-400" /> Live interactive Zoom classes</li>
                <li className="flex gap-2"><Check className="size-4 text-emerald-400" /> Hands-on capstone project</li>
                <li className="flex gap-2"><Check className="size-4 text-emerald-400" /> Certificate of completion</li>
                <li className="flex gap-2"><Check className="size-4 text-emerald-400" /> Pay easily by bank transfer</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky enroll bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl lg:hidden">
        <div className="container-x flex items-center justify-between gap-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div>
            <p className="text-xs text-white/55">Course fee</p>
            <p className="font-display text-xl font-bold">{formatLKR(course.price_lkr)}</p>
          </div>
          <button onClick={enroll} className="btn btn-primary flex-1 sm:flex-none">
            Enroll now <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
