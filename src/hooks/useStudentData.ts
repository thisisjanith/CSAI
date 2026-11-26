import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Enrollment, Session } from '../lib/types'

/** Enrollments (with course) and sessions visible to the signed-in student. */
export function useStudentData() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const [en, se] = await Promise.all([
      supabase.from('enrollments').select('*, course:courses(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      // RLS only returns sessions for courses where the student is active
      supabase.from('sessions').select('*, course:courses(title, slug)').order('starts_at'),
    ])
    setEnrollments((en.data as Enrollment[]) ?? [])
    setSessions((se.data as Session[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return { enrollments, sessions, loading, reload: load }
}
