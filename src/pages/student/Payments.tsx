import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import { PageLoader } from '../../components/Spinner'
import { formatDate, formatLKR, paymentRef, paymentStatusMeta } from '../../lib/format'
import type { Payment } from '../../lib/types'

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[] | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('payments')
      .select('*, course:courses(title, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments((data as Payment[]) ?? []))
  }, [user])

  if (!payments) return <PageLoader />

  return (
    <>
      <PageHeader title="Payments" subtitle="Your payment history and verification status" />
      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payments yet" text="Payments you submit will appear here." />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const meta = paymentStatusMeta[p.status]
            return (
              <div key={p.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.course?.title}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {formatDate(p.created_at)} · Ref <span className="font-mono">{paymentRef(p.enrollment_id)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold">{formatLKR(p.amount_lkr)}</p>
                    <span className={`badge mt-1 ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
                {p.admin_note && (
                  <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                    <span className="font-semibold text-white/85">Note from CSAI:</span> {p.admin_note}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
