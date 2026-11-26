import { Link } from 'react-router'
import { ArrowUpRight, Clock, Signal } from 'lucide-react'
import CourseIcon, { courseAccent } from './CourseIcon'
import type { Course } from '../lib/types'
import { formatLKR } from '../lib/format'

export default function CourseCard({ course }: { course: Course }) {
  const accent = courseAccent[course.icon ?? ''] ?? 'from-white/10 to-transparent'
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group card relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
    >
      <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 transition-opacity group-hover:opacity-100`} />
      <div className="relative flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/8 ring-1 ring-white/10">
          <CourseIcon kind={course.icon} className="size-6 text-white" />
        </span>
        <ArrowUpRight className="size-5 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
      </div>
      <h3 className="relative mt-5 text-xl font-bold">{course.title}</h3>
      <p className="relative mt-2 flex-1 text-sm text-white/65">{course.tagline}</p>
      <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
        {course.duration && (
          <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{course.duration}</span>
        )}
        {course.level && (
          <span className="flex items-center gap-1.5"><Signal className="size-3.5" />{course.level}</span>
        )}
      </div>
      <div className="relative mt-5 flex items-center justify-between border-t border-white/8 pt-4">
        <span className="font-display text-lg font-bold">{formatLKR(course.price_lkr)}</span>
        <span className="text-sm font-semibold text-brand-cyan">View course</span>
      </div>
    </Link>
  )
}
