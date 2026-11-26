import { useEffect, useState } from 'react'
import { fallbackCourses } from '../data/courses'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Course } from '../lib/types'

let cache: Course[] | null = null

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(cache ?? fallbackCourses)
  const [loading, setLoading] = useState(!cache && isSupabaseConfigured)

  useEffect(() => {
    if (cache || !isSupabaseConfigured) return
    let alive = true
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!alive) return
        if (!error && data && data.length) {
          cache = data as Course[]
          setCourses(cache)
        }
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { courses, loading }
}

export function invalidateCourses() {
  cache = null
}
