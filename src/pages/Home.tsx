import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  Award,
  CreditCard,
  Laptop,
  MessageCircle,
  Minus,
  Plus,
  Rocket,
  UserPlus,
  Users,
  Video,
  BookOpenCheck,
} from 'lucide-react'
import Hero from '../components/hero/Hero'
import CourseCard from '../components/CourseCard'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../context/AuthContext'
import { site } from '../lib/config'

gsap.registerPlugin(ScrollTrigger)

const tools = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Cursor', 'Canva AI', 'Runway', 'Perplexity', 'Notion AI', 'ElevenLabs', 'Firefly']

const features = [
  { icon: Video, title: 'Live on Zoom', text: 'Interactive classes with real instructors. Ask questions, get answers, learn together.' },
  { icon: Rocket, title: 'Project-based', text: 'Every module ends with something you built, ready for your portfolio or business.' },
  { icon: Users, title: 'Small cohorts', text: 'Focused groups so you get attention, feedback and a community of peers.' },
  { icon: Award, title: 'Certificate', text: 'Earn a CSAI certificate of completion to showcase your new AI skills.' },
  { icon: Laptop, title: 'Learn from anywhere', text: 'All you need is a phone or laptop and an internet connection. Island-wide.' },
  { icon: BookOpenCheck, title: 'Up-to-date', text: 'AI moves fast. Our curriculum is refreshed with the latest tools every intake.' },
]

const steps = [
  { icon: UserPlus, title: 'Create your account', text: 'Sign up in seconds with Google or email.' },
  { icon: BookOpenCheck, title: 'Choose a program', text: 'Pick the course that matches your goals.' },
  { icon: CreditCard, title: 'Pay by bank transfer', text: 'Transfer the fee and upload your slip. We verify quickly.' },
  { icon: Video, title: 'Join live classes', text: 'Your dashboard shows the schedule and one-tap Zoom links.' },
]

const faqs = [
  { q: 'Do I need prior technical knowledge?', a: 'No. Professional Skills and Digital Marketing start from zero. Game Development and App Development are beginner-friendly too. AI tools help you move fast while we teach the fundamentals.' },
  { q: 'How are classes conducted?', a: 'All classes are live on Zoom. Once your enrollment is active, your dashboard shows every scheduled session with a one-tap "Join" button that unlocks shortly before class starts.' },
  { q: 'How do I pay?', a: 'For now we accept bank transfers. After choosing a course, you will see our bank details and a unique reference code. Upload your payment slip and we will activate your enrollment once verified. Card payments via PayHere are coming soon.' },
  { q: 'How long does payment verification take?', a: 'Usually within a few hours during working days. You will see the status update in your dashboard.' },
  { q: 'Can I join from my phone?', a: 'Yes. The website and Zoom both work great on mobile. A laptop is recommended for the Game and App Development programs.' },
  { q: 'Will I get a certificate?', a: 'Yes. Students who complete the program and its capstone project receive a CSAI certificate of completion.' },
]

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const { courses } = useCourses()
  const { user } = useAuth()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduced-motion')
      return
    }
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('.reveal', {
        start: 'top 88%',
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      })
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.to(el, {
          yPercent: Number(el.dataset.parallax),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, root)
    // Pinned hero changes layout height after mount
    const t = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => {
      clearTimeout(t)
      ctx.revert()
    }
  }, [courses.length])

  return (
    <div ref={root}>
      <Hero />

      {/* Tool marquee */}
      <section aria-label="AI tools you will learn" className="relative border-y border-white/5 bg-ink-900/60 py-5">
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 pr-10">
            {[...tools, ...tools].map((t, i) => (
              <span key={i} className="font-display text-lg font-semibold whitespace-nowrap text-white/35 sm:text-xl">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="courses" className="relative py-20 sm:py-28">
        <div className="container-x">
          <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-widest text-brand-cyan uppercase">Programs</p>
              <h2 className="mt-3 text-3xl font-bold text-balance sm:text-5xl">
                Four paths to becoming <span className="text-gradient">AI-powered</span>
              </h2>
              <p className="mt-4 text-white/65 sm:text-lg">
                Practical programs designed for students, professionals and entrepreneurs.
              </p>
            </div>
            <Link to="/courses" className="btn btn-ghost self-start md:self-auto">
              All courses <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {courses.slice(0, 4).map((c) => (
              <div key={c.id} className="reveal">
                <CourseCard course={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CSAI */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div aria-hidden data-parallax="-25" className="pointer-events-none absolute top-10 -right-40 h-[420px] w-[420px] rounded-full bg-brand-violet/15 blur-[120px]" />
        <div className="container-x">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-semibold tracking-widest text-brand-gold uppercase">Why CSAI</p>
            <h2 className="mt-3 text-3xl font-bold text-balance sm:text-5xl">
              Built for how people <span className="text-gradient">actually learn</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="reveal card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-violet/20 ring-1 ring-white/10">
                  <f.icon className="size-5 text-brand-cyan" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-white/60">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 py-20 sm:py-28">
        <div className="container-x">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-widest text-brand-cyan uppercase">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-balance sm:text-5xl">From sign-up to your first class</h2>
          </div>
          <ol className="relative mt-12 grid gap-4 md:grid-cols-4 md:gap-5">
            <div aria-hidden className="absolute top-7 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-gold opacity-40 md:block" />
            {steps.map((s, i) => (
              <li key={s.title} className="reveal relative flex gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-ink-800">
                  <s.icon className="size-6 text-white" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-brand-gold text-xs font-bold text-ink-950">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="font-bold md:mt-4">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative scroll-mt-20 py-20 sm:py-28">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="reveal">
            <p className="text-sm font-semibold tracking-widest text-brand-gold uppercase">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Questions, answered</h2>
            <p className="mt-4 text-white/60">Still unsure? Message us on WhatsApp and we'll help you pick the right program.</p>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost mt-6">
              <MessageCircle className="size-4 text-emerald-400" /> Chat on WhatsApp
            </a>
          </div>
          <div className="reveal divide-y divide-white/8 rounded-2xl border border-white/8 bg-ink-900/60">
            {faqs.map((f) => (
              <Faq key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative pb-24">
        <div className="container-x">
          <div className="reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div aria-hidden className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-violet/25 blur-[100px]" />
            <h2 className="relative text-3xl font-bold text-balance sm:text-5xl">
              The future speaks AI. <span className="text-gradient">Start speaking it.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/65 sm:text-lg">
              Create your free account today and reserve your seat in the next intake.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={user ? '/dashboard' : '/signup'} className="btn btn-gold">
                {user ? 'Open dashboard' : 'Get started free'} <ArrowRight className="size-4" />
              </Link>
              <Link to="/courses" className="btn btn-ghost">Browse courses</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold sm:px-6 sm:py-5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {q}
        {open ? <Minus className="size-5 shrink-0 text-brand-cyan" /> : <Plus className="size-5 shrink-0 text-white/50" />}
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-white/65 sm:px-6">{a}</p>
        </div>
      </div>
    </div>
  )
}
