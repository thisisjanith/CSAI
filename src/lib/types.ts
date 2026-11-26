export type Role = 'student' | 'admin'
export type EnrollmentStatus = 'pending_payment' | 'pending_verification' | 'active' | 'rejected' | 'cancelled'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type PaymentMethod = 'bank_transfer' | 'payhere' | 'manual'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  city: string | null
  avatar_url: string | null
  role: Role
  created_at: string
}

export interface OutlineModule {
  title: string
  topics: string[]
}

export interface Course {
  id: string
  slug: string
  title: string
  tagline: string | null
  description: string | null
  price_lkr: number
  duration: string | null
  level: string | null
  icon: string | null
  highlights: string[]
  outline: OutlineModule[]
  is_published: boolean
  sort_order: number
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  activated_at: string | null
  created_at: string
  course?: Course
}

export interface Payment {
  id: string
  enrollment_id: string
  user_id: string
  course_id: string
  amount_lkr: number
  method: PaymentMethod
  reference: string | null
  paid_on: string | null
  slip_path: string | null
  status: PaymentStatus
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
  course?: Pick<Course, 'title' | 'slug'>
  profile?: Pick<Profile, 'full_name' | 'email' | 'phone'>
}

export interface Session {
  id: string
  course_id: string
  title: string
  description: string | null
  starts_at: string
  duration_minutes: number
  zoom_url: string | null
  zoom_meeting_id: string | null
  zoom_passcode: string | null
  recording_url: string | null
  course?: Pick<Course, 'title' | 'slug'>
}
