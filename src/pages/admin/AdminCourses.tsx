import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { BookPlus, Eye, EyeOff, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/dashboard/DashboardShell'
import Modal from '../../components/dashboard/Modal'
import CourseIcon, { courseIconKeys } from '../../components/CourseIcon'
import { PageLoader } from '../../components/Spinner'
import { formatLKR, slugify } from '../../lib/format'
import { invalidateCourses } from '../../hooks/useCourses'
import type { Course, OutlineModule } from '../../lib/types'

type Draft = Omit<Course, 'id' | 'highlights' | 'outline'> & { id?: string; highlightsText: string; outlineText: string }

/** Outline editor format: "# Module title" lines followed by one topic per line. */
const outlineToText = (o: OutlineModule[]) => o.map((m) => [`# ${m.title}`, ...m.topics].join('\n')).join('\n\n')
const textToOutline = (t: string): OutlineModule[] => {
  const out: OutlineModule[] = []
  for (const raw of t.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) out.push({ title: line.replace(/^#+\s*/, ''), topics: [] })
    else {
      if (!out.length) out.push({ title: 'Module 1', topics: [] })
      out[out.length - 1].topics.push(line.replace(/^[-*•]\s*/, ''))
    }
  }
  return out
}

const toDraft = (c?: Course): Draft => ({
  id: c?.id,
  slug: c?.slug ?? '',
  title: c?.title ?? '',
  tagline: c?.tagline ?? '',
  description: c?.description ?? '',
  price_lkr: c?.price_lkr ?? 0,
  duration: c?.duration ?? '',
  level: c?.level ?? '',
  icon: c?.icon ?? 'code',
  is_published: c?.is_published ?? false,
  sort_order: c?.sort_order ?? 0,
  highlightsText: (c?.highlights ?? []).join('\n'),
  outlineText: outlineToText(c?.outline ?? []),
})

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('courses').select('*').order('sort_order')
    setCourses((data as Course[]) ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    const row = {
      slug: draft.slug || slugify(draft.title),
      title: draft.title.trim(),
      tagline: draft.tagline?.trim() || null,
      description: draft.description?.trim() || null,
      price_lkr: Math.max(0, Math.round(Number(draft.price_lkr) || 0)),
      duration: draft.duration?.trim() || null,
      level: draft.level?.trim() || null,
      icon: draft.icon,
      is_published: draft.is_published,
      sort_order: Number(draft.sort_order) || 0,
      highlights: draft.highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
      outline: textToOutline(draft.outlineText),
    }
    const { error } = draft.id ? await supabase.from('courses').update(row).eq('id', draft.id) : await supabase.from('courses').insert(row)
    setBusy(false)
    if (error) return toast.error(error.code === '23505' ? 'That URL slug is already used.' : error.message)
    invalidateCourses()
    toast.success('Course saved')
    setDraft(null)
    load()
  }

  const togglePublish = async (c: Course) => {
    const { error } = await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id)
    if (error) return toast.error(error.message)
    invalidateCourses()
    load()
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d))

  if (!courses) return <PageLoader />

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Edit programs, pricing and outlines"
        action={
          <button onClick={() => setDraft(toDraft())} className="btn btn-primary self-start">
            <BookPlus className="size-4" /> New course
          </button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {courses.map((c) => (
          <div key={c.id} className="card flex items-center gap-4 p-4 sm:p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/8">
              <CourseIcon kind={c.icon} className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.title}</p>
              <p className="text-sm text-white/55">
                {formatLKR(c.price_lkr)} · {c.is_published ? <span className="text-emerald-300">Published</span> : <span className="text-white/40">Hidden</span>}
              </p>
            </div>
            <button onClick={() => togglePublish(c)} className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white" aria-label={c.is_published ? 'Hide course' : 'Publish course'}>
              {c.is_published ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
            <button onClick={() => setDraft(toDraft(c))} className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white" aria-label="Edit course">
              <Pencil className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit course' : 'New course'}
        wide
        footer={
          <button form="course-form" type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Saving…' : 'Save course'}
          </button>
        }
      >
        {draft && (
          <form id="course-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-title">Title</label>
              <input id="c-title" className="input" required value={draft.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="c-slug">URL slug</label>
              <input id="c-slug" className="input" placeholder={slugify(draft.title) || 'auto from title'} value={draft.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="c-price">Price (LKR)</label>
              <input id="c-price" type="number" min={0} step={500} inputMode="numeric" className="input" required value={draft.price_lkr} onChange={(e) => set('price_lkr', Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-tag">Tagline</label>
              <input id="c-tag" className="input" value={draft.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-desc">Description</label>
              <textarea id="c-desc" className="input" value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="c-dur">Duration</label>
              <input id="c-dur" className="input" placeholder="8 weeks · live on Zoom" value={draft.duration ?? ''} onChange={(e) => set('duration', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="c-level">Level</label>
              <input id="c-level" className="input" placeholder="Beginner" value={draft.level ?? ''} onChange={(e) => set('level', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="c-icon">Icon</label>
              <select id="c-icon" className="input" value={draft.icon ?? ''} onChange={(e) => set('icon', e.target.value)}>
                {courseIconKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-sort">Display order</label>
              <input id="c-sort" type="number" inputMode="numeric" className="input" value={draft.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-hl">Highlights (one per line)</label>
              <textarea id="c-hl" className="input" value={draft.highlightsText} onChange={(e) => set('highlightsText', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-out">Outline: start modules with "#", then one topic per line</label>
              <textarea id="c-out" className="input min-h-56 font-mono text-sm" placeholder={'# Foundations\nHow AI works\nPrompting basics\n\n# Next module\nTopic'} value={draft.outlineText} onChange={(e) => set('outlineText', e.target.value)} />
            </div>
            <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="size-5 accent-cyan-400" checked={draft.is_published} onChange={(e) => set('is_published', e.target.checked)} />
              Published (visible on the website)
            </label>
          </form>
        )}
      </Modal>
    </>
  )
}
