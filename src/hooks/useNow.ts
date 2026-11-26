import { useEffect, useState } from 'react'

/** Re-renders every `interval` ms. Used for countdowns / "Join now" buttons. */
export function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}
