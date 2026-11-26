import CourseCard from '../components/CourseCard'
import { useCourses } from '../hooks/useCourses'

export default function Courses() {
  const { courses } = useCourses()
  return (
    <section className="relative pt-[calc(7rem+env(safe-area-inset-top))] pb-24">
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-brand-violet/15 blur-[120px]" />
      <div className="container-x relative">
        <p className="text-sm font-semibold tracking-widest text-brand-cyan uppercase">Courses</p>
        <h1 className="mt-3 text-4xl font-bold text-balance sm:text-6xl">
          Choose your <span className="text-gradient">AI path</span>
        </h1>
        <p className="mt-4 max-w-2xl text-white/65 sm:text-lg">
          Every program is taught live on Zoom with hands-on projects. Enroll online and pay by bank transfer.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </section>
  )
}
