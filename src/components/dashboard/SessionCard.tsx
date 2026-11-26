import { CalendarClock, Copy, PlayCircle, Video } from 'lucide-react'
import { toast } from 'sonner'
import type { Session } from '../../lib/types'
import { formatDateTime, formatTime, relativeFromNow, sessionState } from '../../lib/format'
import { JOIN_WINDOW_MINUTES } from '../../lib/config'

export function JoinButton({ session, now, className = '' }: { session: Session; now: number; className?: string }) {
  const state = sessionState(session.starts_at, session.duration_minutes, JOIN_WINDOW_MINUTES, now)

  if (state === 'ended') {
    return session.recording_url ? (
      <a href={session.recording_url} target="_blank" rel="noreferrer" className={`btn btn-ghost btn-sm ${className}`}>
        <PlayCircle className="size-4" /> Recording
      </a>
    ) : (
      <span className={`text-xs text-white/40 ${className}`}>Ended</span>
    )
  }
  if ((state === 'open' || state === 'live') && session.zoom_url) {
    return (
      <a href={session.zoom_url} target="_blank" rel="noreferrer" className={`btn btn-primary btn-sm ${className}`}>
        <Video className="size-4" /> {state === 'live' ? 'Join now (live)' : 'Join on Zoom'}
      </a>
    )
  }
  return (
    <span className={`btn btn-ghost btn-sm pointer-events-none opacity-70 ${className}`}>
      <CalendarClock className="size-4" /> {state === 'upcoming' ? `Opens ${relativeFromNow(new Date(new Date(session.starts_at).getTime() - JOIN_WINDOW_MINUTES * 60000).toISOString(), now)}` : 'Link coming soon'}
    </span>
  )
}

export default function SessionCard({ session, now }: { session: Session; now: number }) {
  const state = sessionState(session.starts_at, session.duration_minutes, JOIN_WINDOW_MINUTES, now)
  const end = new Date(new Date(session.starts_at).getTime() + session.duration_minutes * 60000).toISOString()

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`))
  }

  return (
    <div className={`card p-4 sm:p-5 ${state === 'live' ? 'border-emerald-400/40' : ''}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-cyan">{session.course?.title}</p>
          <h3 className="mt-1 font-semibold">{session.title}</h3>
          <p className="mt-1 text-sm text-white/60">
            {formatDateTime(session.starts_at)} – {formatTime(end)}
            {state === 'live' && <span className="ml-2 font-semibold text-emerald-400">● Live</span>}
          </p>
          {session.description && <p className="mt-2 text-sm text-white/50">{session.description}</p>}
          {(session.zoom_meeting_id || session.zoom_passcode) && state !== 'ended' && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              {session.zoom_meeting_id && (
                <button onClick={() => copy(session.zoom_meeting_id!, 'Meeting ID')} className="flex min-h-8 items-center gap-1 hover:text-white">
                  ID: {session.zoom_meeting_id} <Copy className="size-3" />
                </button>
              )}
              {session.zoom_passcode && (
                <button onClick={() => copy(session.zoom_passcode!, 'Passcode')} className="flex min-h-8 items-center gap-1 hover:text-white">
                  Passcode: {session.zoom_passcode} <Copy className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <JoinButton session={session} now={now} className="w-full shrink-0 sm:w-auto" />
      </div>
    </div>
  )
}
