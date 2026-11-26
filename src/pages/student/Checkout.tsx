import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Clock, Copy, FileUp, Landmark, X } from 'lucide-react'
import { supabase, SLIP_BUCKET } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { bankDetails } from '../../lib/config'
import { formatLKR, paymentRef } from '../../lib/format'
import type { Course, Enrollment } from '../../lib/types'
import { PageLoader } from '../../components/Spinner'
import CourseIcon from '../../components/CourseIcon'

const MAX_MB = 5

export default function Checkout() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user || !slug) return
    const { data: c } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle()
    if (!c) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setCourse(c as Course)

    const findEnrollment = () => supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', c.id).maybeSingle()
    let { data: en } = await findEnrollment()
    if (!en) {
      // Reserve a seat (pending payment). Unique constraint makes this idempotent.
      const { data: created, error } = await supabase
        .from('enrollments')
        .insert({ user_id: user.id, course_id: c.id })
        .select()
        .single()
      if (error && error.code !== '23505') toast.error(error.message)
      en = created ?? (await findEnrollment()).data
    }
    setEnrollment(en as Enrollment)
    setLoading(false)
  }, [user, slug])

  useEffect(() => {
    load()
  }, [load])

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`File is too large (max ${MAX_MB} MB).`)
    if (!/^image\/|application\/pdf/.test(f.type)) return toast.error('Please upload an image or PDF.')
    setFile(f)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !enrollment) return
    if (!file) return toast.error('Please attach your bank slip.')
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${enrollment.id}-${Date.now()}.${ext}`
      const up = await supabase.storage.from(SLIP_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (up.error) throw up.error
      const { error } = await supabase.from('payments').insert({
        enrollment_id: enrollment.id,
        user_id: user.id,
        course_id: enrollment.course_id,
        amount_lkr: course?.price_lkr ?? 0,
        reference: reference.trim() || null,
        paid_on: paidOn || null,
        slip_path: path,
      })
      if (error) throw error
      toast.success('Payment submitted! We will verify it shortly.')
      setFile(null)
      await load()
    } catch (err) {
      toast.error((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader />
  if (notFound || !course) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">Course not found.</p>
        <Link to="/courses" className="btn btn-ghost mt-4">Browse courses</Link>
      </div>
    )
  }

  const ref = enrollment ? paymentRef(enrollment.id) : ''
  const copy = (text: string, label: string) => navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`))

  const header = (
    <>
      <Link to="/dashboard/courses" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="size-4" /> My courses
      </Link>
      <div className="mt-2 mb-6 flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/8">
          <CourseIcon kind={course.icon} className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{course.title}</h1>
          <p className="text-white/60">{formatLKR(course.price_lkr)}</p>
        </div>
      </div>
    </>
  )

  if (enrollment?.status === 'active') {
    return (
      <>
        {header}
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-400" />
          <h2 className="mt-4 text-xl font-bold">You're enrolled!</h2>
          <p className="mt-2 text-white/60">Your payment is approved. See your classes in the schedule.</p>
          <Link to="/dashboard/schedule" className="btn btn-primary mt-6">Open schedule</Link>
        </div>
      </>
    )
  }

  if (enrollment?.status === 'pending_verification') {
    return (
      <>
        {header}
        <div className="card p-8 text-center">
          <Clock className="mx-auto size-14 text-sky-300" />
          <h2 className="mt-4 text-xl font-bold">Verifying your payment</h2>
          <p className="mx-auto mt-2 max-w-md text-white/60">
            Thanks! We received your bank slip and are checking it. This usually takes a few hours during working days.
          </p>
          <Link to="/dashboard" className="btn btn-ghost mt-6">Back to dashboard</Link>
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      {enrollment?.status === 'rejected' && (
        <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
          Your previous payment could not be verified. Please check the details and upload a clear slip again.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Step 1 */}
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-full bg-brand-gold text-sm text-ink-950">1</span>
            Transfer the course fee
          </h2>
          <div className="mt-5 rounded-2xl bg-ink-950/60 p-4">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Landmark className="size-4" /> {bankDetails.bank} · {bankDetails.branch}
            </div>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="Account name" value={bankDetails.accountName} onCopy={copy} />
              <Row label="Account number" value={bankDetails.accountNumber} mono onCopy={copy} />
              <Row label="Amount" value={formatLKR(course.price_lkr)} copyValue={String(course.price_lkr)} onCopy={copy} />
              <Row label="Reference" value={ref} mono highlight onCopy={copy} />
            </dl>
          </div>
          <p className="mt-4 text-sm text-white/55">
            Please use <strong className="text-brand-gold">{ref}</strong> as the payment reference / remark so we can match your transfer quickly.
          </p>
        </section>

        {/* Step 2 */}
        <form onSubmit={submit} className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-full bg-brand-gold text-sm text-ink-950">2</span>
            Upload your bank slip
          </h2>

          <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          {file ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <FileUp className="size-5 shrink-0 text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="grid size-10 place-items-center rounded-lg hover:bg-white/10" aria-label="Remove file">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                pickFile(e.dataTransfer.files?.[0])
              }}
              className="mt-5 flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-white/15 px-4 py-8 text-center transition-colors hover:border-brand-cyan/60 hover:bg-white/[0.02]"
            >
              <FileUp className="size-8 text-brand-cyan" />
              <span className="mt-3 font-semibold">Tap to upload slip</span>
              <span className="mt-1 text-xs text-white/50">Photo or PDF · max {MAX_MB} MB</span>
            </button>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="paidOn" className="label">Date paid</label>
              <input id="paidOn" type="date" className="input" value={paidOn} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ref" className="label">Bank reference (optional)</label>
              <input id="ref" className="input" placeholder="Txn / slip no." value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={busy || !file} className="btn btn-primary mt-6 w-full">
            {busy ? 'Submitting…' : 'Submit payment'}
          </button>
          <p className="mt-3 text-center text-xs text-white/40">Card payments via PayHere are coming soon.</p>
        </form>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  copyValue,
  mono,
  highlight,
  onCopy,
}: {
  label: string
  value: string
  copyValue?: string
  mono?: boolean
  highlight?: boolean
  onCopy: (v: string, label: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/50">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">
        <span className={`truncate font-semibold ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-gold' : ''}`}>{value}</span>
        <button type="button" onClick={() => onCopy(copyValue ?? value, label)} className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Copy ${label}`}>
          <Copy className="size-4" />
        </button>
      </dd>
    </div>
  )
}
