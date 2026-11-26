import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useStudentData } from '../../hooks/useStudentData'
import { useNow } from '../../hooks/useNow'
import SessionCard from '../../components/dashboard/SessionCard'
import { EmptyState, PageHeader } from '../../components/dashboard/DashboardShell'
import { PageLoader } from '../../components/Spinner'
import type { Session } from '../../lib/types'

function groupByDay(list: Session[]) {
  const groups = new Map<string, Session[]>()
  for (const s of list) {
    const key = new Date(s.starts_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return [...groups.entries()]
}

export default function Schedule() {
  const { sessions, loading } = useStudentData()
  const now = useNow(20_000)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  if (loading) return <PageLoader />

  const isOver = (s: Session) => new Date(s.starts_at).getTime() + s.duration_minutes * 60000 <= now
  const list = tab === 'upcoming' ? sessions.filter((s) => !isOver(s)) : sessions.filter(isOver).reverse()

  return (
    <>
      <PageHeader title="Class schedule" subtitle="Join links unlock 15 minutes before each class" />
      <div className="mb-5 inline-flex rounded-xl bg-white/5 p-1">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-10 rounded-lg px-4 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/55'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === 'upcoming' ? 'No upcoming classes' : 'No past classes yet'}
          text={tab === 'upcoming' ? 'Scheduled sessions for your active courses will appear here.' : undefined}
        />
      ) : (
        <div className="space-y-7">
          {groupByDay(list).map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold text-white/55">{day}</h2>
              <div className="space-y-3">
                {items.map((s) => (
                  <SessionCard key={s.id} session={s} now={now} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
