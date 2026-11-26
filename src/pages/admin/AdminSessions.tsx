import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { CalendarPlus, CalendarDays, Pencil, Trash2, Video } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import Modal from '../../components/dashboard/Modal'
import { PageLoader } from '../../components/Spinner'
import { formatDateTime } from '../../lib/format'
import type { Course, Session } from '../../lib/types'

type Draft = {
  id?: string
  course_id: string
  title: string
  description: string
  starts_at: string // datetime-local value
  duration_minutes: number
  zoom_url: string
  zoom_meeting_id: string
  zoom_passcode: string
  recording_url: string
  repeat_weeks: number
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const emptyDraft = (course_id = ''): Draft => ({
  course_id,
  title: '',
  description: '',
  starts_at: '',
  duration_minutes: 90,
  zoom_url: '',
  zoom_meeting_id: '',
  zoom_passcode: '',
  recording_url: '',
  repeat_weeks: 1,
})

export default function AdminSessions() {
  const [courses, setCourses] = useState<Pick<Course, 'id' | 'title'>[]>([])
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const nowIso = new Date(Date.now() - 3 * 3600000).toISOString()
    let q = supabase.from('sessions').select('*, course:courses(title, slug)').limit(300)
    q = tab === 'upcoming' ? q.gte('starts_at', nowIso).order('starts_at') : q.lt('starts_at', nowIso).order('starts_at', { ascending: false })
    if (courseFilter) q = q.eq('course_id', courseFilter)
    const { data } = await q
    setSessions((data as Session[]) ?? [])
  }, [tab, courseFilter])

  useEffect(() => {
    supabase.from('courses').select('id, title').order('sort_order').then(({ data }) => setCourses(data ?? []))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const edit = (s: Session) =>
    setDraft({
      id: s.id,
      course_id: s.course_id,
      title: s.title,
      description: s.description ?? '',
      starts_at: toLocalInput(s.starts_at),
      duration_minutes: s.duration_minutes,
      zoom_url: s.zoom_url ?? '',
      zoom_meeting_id: s.zoom_meeting_id ?? '',
      zoom_passcode: s.zoom_passcode ?? '',
      recording_url: s.recording_url ?? '',
      repeat_weeks: 1,
    })

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft) return
    if (draft.zoom_url && !/^https:\/\//.test(draft.zoom_url)) return toast.error('Zoom link must start with https://')
    setBusy(true)
    const base = {
      course_id: draft.course_id,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      duration_minutes: Number(draft.duration_minutes) || 90,
      zoom_url: draft.zoom_url.trim() || null,
      zoom_meeting_id: draft.zoom_meeting_id.trim() || null,
      zoom_passcode: draft.zoom_passcode.trim() || null,
      recording_url: draft.recording_url.trim() || null,
    }
    const start = new Date(draft.starts_at)
    let error
    if (draft.id) {
      ;({ error } = await supabase.from('sessions').update({ ...base, starts_at: start.toISOString() }).eq('id', draft.id))
    } else {
      const weeks = Math.max(1, Math.min(52, Number(draft.repeat_weeks) || 1))
      const rows = Array.from({ length: weeks }, (_, i) => ({
        ...base,
        title: weeks > 1 ? `${base.title}: Week ${i + 1}` : base.title,
        starts_at: new Date(start.getTime() + i * 7 * 86400000).toISOString(),
      }))
      ;({ error } = await supabase.from('sessions').insert(rows))
    }
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success(draft.id ? 'Session updated' : 'Session scheduled')
    setDraft(null)
    load()
  }

  const remove = async (s: Session) => {
    if (!confirm(`Delete "${s.title}"? Students will no longer see it.`)) return
    const { error } = await supabase.from('sessions').delete().eq('id', s.id)
    if (error) return toast.error(error.message)
    toast.success('Session deleted')
    load()
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d))

  return (
    <>
      <PageHeader
        title="Class schedule"
        subtitle="Schedule Zoom sessions. Enrolled students see them instantly"
        action={
          <button onClick={() => setDraft(emptyDraft(courseFilter || courses[0]?.id))} className="btn btn-primary self-start">
            <CalendarPlus className="size-4" /> New session
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="inline-flex w-fit rounded-xl bg-white/5 p-1">
          {(['upcoming', 'past'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`min-h-10 rounded-lg px-4 text-sm font-medium capitalize ${tab === t ? 'bg-white/10 text-white' : 'text-white/55'}`}>
              {t}
            </button>
          ))}
        </div>
        <select className="input sm:max-w-xs" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Filter by course">
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {!sessions ? (
        <PageLoader />
      ) : sessions.length === 0 ? (
        <EmptyState icon={CalendarDays} title={`No ${tab} sessions`} />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="card flex items-center gap-3 p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-brand-cyan">{s.course?.title}</p>
                <p className="mt-0.5 truncate font-semibold">{s.title}</p>
                <p className="mt-0.5 text-sm text-white/55">
                  {formatDateTime(s.starts_at)} · {s.duration_minutes} min
                </p>
                {!s.zoom_url && tab === 'upcoming' && <p className="mt-1 text-xs text-amber-300">No Zoom link yet</p>}
              </div>
              {s.zoom_url && (
                <a href={s.zoom_url} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white" aria-label="Open Zoom link">
                  <Video className="size-5" />
                </a>
              )}
              <button onClick={() => edit(s)} className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white" aria-label="Edit">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => remove(s)} className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-rose-500/15 hover:text-rose-300" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit session' : 'New session'}
        footer={
          <button form="session-form" type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Saving…' : draft?.id ? 'Save changes' : 'Schedule'}
          </button>
        }
      >
        {draft && (
          <form id="session-form" onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="s-course">Course</label>
              <select id="s-course" className="input" required value={draft.course_id} onChange={(e) => set('course_id', e.target.value)}>
                <option value="" disabled>Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-title">Title</label>
              <input id="s-title" className="input" required placeholder="e.g. Prompting fundamentals" value={draft.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-start">Starts at</label>
                <input id="s-start" type="datetime-local" className="input" required value={draft.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="s-dur">Duration (minutes)</label>
                <input id="s-dur" type="number" min={15} step={15} inputMode="numeric" className="input" value={draft.duration_minutes} onChange={(e) => set('duration_minutes', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="s-zoom">Zoom join link</label>
              <input id="s-zoom" type="url" inputMode="url" className="input" placeholder="https://us06web.zoom.us/j/…" value={draft.zoom_url} onChange={(e) => set('zoom_url', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-mid">Meeting ID</label>
                <input id="s-mid" className="input" value={draft.zoom_meeting_id} onChange={(e) => set('zoom_meeting_id', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="s-pass">Passcode</label>
                <input id="s-pass" className="input" value={draft.zoom_passcode} onChange={(e) => set('zoom_passcode', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="s-desc">Description (optional)</label>
              <textarea id="s-desc" className="input" value={draft.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            {draft.id ? (
              <div>
                <label className="label" htmlFor="s-rec">Recording link (after class)</label>
                <input id="s-rec" type="url" inputMode="url" className="input" placeholder="https://…" value={draft.recording_url} onChange={(e) => set('recording_url', e.target.value)} />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="s-rep">Repeat weekly for</label>
                <select id="s-rep" className="input" value={draft.repeat_weeks} onChange={(e) => set('repeat_weeks', Number(e.target.value))}>
                  {[1, 2, 4, 6, 8, 10, 12, 16].map((n) => (
                    <option key={n} value={n}>{n === 1 ? 'Just once' : `${n} weeks`}</option>
                  ))}
                </select>
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  )
}
