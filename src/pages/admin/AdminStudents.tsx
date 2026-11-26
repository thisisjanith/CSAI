import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Phone, Search, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import Modal from '../../components/dashboard/Modal'
import { PageLoader } from '../../components/Spinner'
import { enrollmentStatusMeta, formatDate, initials } from '../../lib/format'
import type { Course, Enrollment, EnrollmentStatus, Profile } from '../../lib/types'

type Row = Profile & { enrollments: Pick<Enrollment, 'id' | 'status' | 'course_id'>[] }

export default function AdminStudents() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Row | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, enrollments(id, status, course_id)')
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) toast.error(error.message)
    setRows((data as Row[]) ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!rows || !term) return rows
    return rows.filter((r) => [r.full_name, r.email, r.phone, r.city].some((v) => v?.toLowerCase().includes(term)))
  }, [rows, q])

  return (
    <>
      <PageHeader title="Students" subtitle={rows ? `${rows.length} registered users` : undefined} />
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-white/40" />
        <input className="input pl-12" type="search" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!filtered ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" />
      ) : (
        <div className="card divide-y divide-white/5">
          {filtered.map((r) => {
            const active = r.enrollments.filter((e) => e.status === 'active').length
            return (
              <button key={r.id} onClick={() => setSelected(r)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-white/[0.02]">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">{initials(r.full_name, r.email)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {r.full_name || '-'} {r.role === 'admin' && <span className="ml-1 text-xs font-semibold text-brand-gold">ADMIN</span>}
                  </p>
                  <p className="truncate text-sm text-white/50">{r.email}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-white/50">
                  <p><span className="font-semibold text-white">{active}</span> active</p>
                  <p className="hidden sm:block">Joined {formatDate(r.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await load()
          }}
        />
      )}
    </>
  )
}

function StudentModal({ student, onClose, onChanged }: { student: Row; onClose: () => void; onChanged: () => Promise<void> }) {
  const [courses, setCourses] = useState<Pick<Course, 'id' | 'title'>[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [grantCourse, setGrantCourse] = useState('')
  const [busy, setBusy] = useState(false)

  const loadEnrollments = useCallback(async () => {
    const { data } = await supabase.from('enrollments').select('*, course:courses(*)').eq('user_id', student.id).order('created_at')
    setEnrollments((data as Enrollment[]) ?? [])
  }, [student.id])

  useEffect(() => {
    supabase.from('courses').select('id, title').order('sort_order').then(({ data }) => setCourses(data ?? []))
    loadEnrollments()
  }, [loadEnrollments])

  const setStatus = async (e: Enrollment, status: EnrollmentStatus) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ status, activated_at: status === 'active' ? e.activated_at ?? new Date().toISOString() : e.activated_at })
      .eq('id', e.id)
    if (error) return toast.error(error.message)
    toast.success('Enrollment updated')
    await loadEnrollments()
    await onChanged()
  }

  const grant = async () => {
    if (!grantCourse) return
    setBusy(true)
    const { error } = await supabase
      .from('enrollments')
      .upsert({ user_id: student.id, course_id: grantCourse, status: 'active', activated_at: new Date().toISOString() }, { onConflict: 'user_id,course_id' })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Access granted')
    setGrantCourse('')
    await loadEnrollments()
    await onChanged()
  }

  const toggleAdmin = async () => {
    const role = student.role === 'admin' ? 'student' : 'admin'
    if (!confirm(role === 'admin' ? `Make ${student.email} an admin? They will have full access.` : `Remove admin access from ${student.email}?`)) return
    const { error } = await supabase.from('profiles').update({ role }).eq('id', student.id)
    if (error) return toast.error(error.message)
    toast.success('Role updated')
    await onChanged()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={student.full_name || student.email || 'Student'}>
      <div className="space-y-2 text-sm">
        {student.email && (
          <a href={`mailto:${student.email}`} className="flex min-h-10 items-center gap-3 text-white/75 hover:text-white">
            <Mail className="size-4 text-white/40" /> {student.email}
          </a>
        )}
        {student.phone && (
          <a href={`tel:${student.phone}`} className="flex min-h-10 items-center gap-3 text-white/75 hover:text-white">
            <Phone className="size-4 text-white/40" /> {student.phone}
          </a>
        )}
        <p className="text-white/45">
          {student.city ? `${student.city} · ` : ''}Joined {formatDate(student.created_at)}
        </p>
      </div>

      <h3 className="mt-6 mb-3 font-bold">Enrollments</h3>
      {enrollments.length === 0 && <p className="text-sm text-white/50">Not enrolled in any course.</p>}
      <div className="space-y-2">
        {enrollments.map((e) => (
          <div key={e.id} className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium">{e.course?.title}</p>
              <span className={`badge ${enrollmentStatusMeta[e.status].cls}`}>{enrollmentStatusMeta[e.status].label}</span>
            </div>
            <div className="mt-2 flex gap-2">
              {e.status !== 'active' && (
                <button onClick={() => setStatus(e, 'active')} className="btn btn-ghost btn-sm">Activate</button>
              )}
              {e.status !== 'cancelled' && (
                <button onClick={() => setStatus(e, 'cancelled')} className="btn btn-ghost btn-sm text-rose-300">Cancel access</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-3 font-bold">Grant course access</h3>
      <p className="mb-3 text-sm text-white/50">For cash payments, scholarships or manual enrollments.</p>
      <div className="flex gap-2">
        <select className="input" value={grantCourse} onChange={(e) => setGrantCourse(e.target.value)} aria-label="Course to grant">
          <option value="">Choose course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button onClick={grant} disabled={!grantCourse || busy} className="btn btn-primary shrink-0">Grant</button>
      </div>

      <div className="mt-8 border-t border-white/5 pt-5">
        <button onClick={toggleAdmin} className="btn btn-ghost btn-sm">
          {student.role === 'admin' ? 'Remove admin role' : 'Make admin'}
        </button>
      </div>
    </Modal>
  )
}
