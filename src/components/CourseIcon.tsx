import { Briefcase, Code2, Gamepad2, GraduationCap, Megaphone, type LucideProps } from 'lucide-react'

const map = {
  briefcase: Briefcase,
  gamepad: Gamepad2,
  code: Code2,
  megaphone: Megaphone,
} as const

export const courseIconKeys = Object.keys(map)

export default function CourseIcon({ kind, ...props }: { kind?: string | null } & LucideProps) {
  const Icon = (kind && map[kind as keyof typeof map]) || GraduationCap
  return <Icon {...props} />
}

/** Accent gradient per course icon, used for cards. */
export const courseAccent: Record<string, string> = {
  briefcase: 'from-cyan-400/25 to-sky-500/5',
  gamepad: 'from-violet-500/25 to-fuchsia-500/5',
  code: 'from-emerald-400/25 to-cyan-500/5',
  megaphone: 'from-amber-400/25 to-orange-500/5',
}
