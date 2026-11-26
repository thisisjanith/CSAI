import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, ExternalLink, Receipt, X } from 'lucide-react'
import { supabase, SLIP_BUCKET } from '../../lib/supabase'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import Modal from '../../components/dashboard/Modal'
import Spinner, { PageLoader } from '../../components/Spinner'
import { formatDate, formatDateTime, formatLKR, paymentRef, paymentStatusMeta } from '../../lib/format'
import type { Payment, PaymentStatus } from '../../lib/types'

type Filter = PaymentStatus | 'all'

export default function AdminPayments() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [selected, setSelected] = useState<Payment | null>(null)

  const load = useCallback(async () => {
    setPayments(null)
    let q = supabase
      .from('payments')
      .select('*, course:courses(title, slug), profile:profiles!payments_user_id_fkey(full_name, email, phone)')
      .order('created_at', { ascending: filter === 'pending' })
      .limit(200)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) toast.error(error.message)
    setPayments((data as Payment[]) ?? [])
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader title="Payments" subtitle="Verify bank transfers and activate enrollments" />
      <div className="-mx-5 mb-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="inline-flex rounded-xl bg-white/5 p-1">
          {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`min-h-10 rounded-lg px-4 text-sm font-medium capitalize ${filter === f ? 'bg-white/10 text-white' : 'text-white/55'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!payments ? (
        <PageLoader />
      ) : payments.length === 0 ? (
        <EmptyState icon={Receipt} title={filter === 'pending' ? 'No payments waiting for review' : 'Nothing here'} />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="card flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:border-white/15 sm:p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.profile?.full_name || p.profile?.email}</p>
                <p className="truncate text-sm text-white/55">{p.course?.title}</p>
                <p className="mt-1 text-xs text-white/40">
                  <span className="font-mono">{paymentRef(p.enrollment_id)}</span> · {formatDate(p.created_at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display font-bold">{formatLKR(p.amount_lkr)}</p>
                <span className={`badge mt-1 ${paymentStatusMeta[p.status].cls}`}>{paymentStatusMeta[p.status].label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ReviewModal
          payment={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null)
            load()
          }}
        />
      )}
    </>
  )
}

function ReviewModal({ payment: p, onClose, onDone }: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const [slipUrl, setSlipUrl] = useState<string | null>(null)
  const [note, setNote] = useState(p.admin_note ?? '')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const isPdf = p.slip_path?.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    if (!p.slip_path) return
    supabase.storage
      .from(SLIP_BUCKET)
      .createSignedUrl(p.slip_path, 600)
      .then(({ data }) => setSlipUrl(data?.signedUrl ?? null))
  }, [p.slip_path])

  const review = async (approve: boolean) => {
    if (!approve && !note.trim()) return toast.error('Add a note so the student knows why.')
    setBusy(approve ? 'approve' : 'reject')
    const { error } = await supabase.rpc('review_payment', { p_payment_id: p.id, p_approve: approve, p_note: note.trim() || null })
    setBusy(null)
    if (error) return toast.error(error.message)
    toast.success(approve ? 'Approved. Enrollment is now active' : 'Payment rejected')
    onDone()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Review payment"
      wide
      footer={
        p.status === 'pending' ? (
          <div className="flex gap-3">
            <button onClick={() => review(false)} disabled={!!busy} className="btn btn-ghost flex-1 text-rose-300">
              <X className="size-4" /> {busy === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
            <button onClick={() => review(true)} disabled={!!busy} className="btn btn-primary flex-1">
              <Check className="size-4" /> {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <dl className="space-y-3 text-sm">
            {[
              ['Student', p.profile?.full_name || '-'],
              ['Email', p.profile?.email || '-'],
              ['Phone', p.profile?.phone || '-'],
              ['Course', p.course?.title || '-'],
              ['Amount', formatLKR(p.amount_lkr)],
              ['Our reference', paymentRef(p.enrollment_id)],
              ['Bank reference', p.reference || '-'],
              ['Paid on', p.paid_on ? formatDate(p.paid_on) : '-'],
              ['Submitted', formatDateTime(p.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-white/50">{k}</dt>
                <dd className="text-right font-medium break-all">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <label htmlFor="note" className="label">Note to student {p.status === 'pending' && '(required to reject)'}</label>
            <textarea id="note" className="input" disabled={p.status !== 'pending'} placeholder="e.g. Amount does not match, please re-upload" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="label">Bank slip</p>
          {!p.slip_path ? (
            <p className="text-sm text-white/50">No slip attached.</p>
          ) : !slipUrl ? (
            <div className="grid h-48 place-items-center rounded-2xl bg-white/5"><Spinner /></div>
          ) : isPdf ? (
            <a href={slipUrl} target="_blank" rel="noreferrer" className="btn btn-ghost w-full">
              Open PDF slip <ExternalLink className="size-4" />
            </a>
          ) : (
            <a href={slipUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-black">
              <img src={slipUrl} alt="Bank slip" className="max-h-[50dvh] w-full object-contain" />
            </a>
          )}
        </div>
      </div>
    </Modal>
  )
}
