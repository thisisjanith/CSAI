export default function Spinner({ className = 'size-6' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-white/15 border-t-brand-cyan ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <Spinner className="size-8" />
    </div>
  )
}
