import { useEffect } from 'react'
import { useLocation } from 'react-router'
import type Lenis from 'lenis'

let lenis: Lenis | null = null
export const getLenis = () => lenis

/** Smooth scrolling for public pages, synced with GSAP ScrollTrigger. */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let disposed = false
    let teardown: (() => void) | undefined
    ;(async () => {
      const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (disposed) return
      gsap.registerPlugin(ScrollTrigger)
      const instance = new LenisCtor({ lerp: 0.1, anchors: { offset: -80 }, autoRaf: false })
      lenis = instance
      instance.on('scroll', ScrollTrigger.update)
      const tick = (time: number) => instance.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      teardown = () => {
        gsap.ticker.remove(tick)
        instance.destroy()
        lenis = null
      }
    })()
    return () => {
      disposed = true
      teardown?.()
    }
  }, [])
}

/** Scroll to top (or to #hash) on route change. */
export function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => {
        const el = document.querySelector(hash)
        if (!el) return
        if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -80 })
        else el.scrollIntoView({ behavior: 'smooth' })
      }, 120)
      return () => clearTimeout(t)
    }
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
}
