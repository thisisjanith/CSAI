import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../../context/AuthContext'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const section = sectionRef.current!
    const canvas = canvasRef.current!
    const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let cleanup: (() => void) | undefined
    let particlesContainer: { destroy: () => void } | undefined

    const ctx = gsap.context(() => {
      // Intro of the HTML overlay
      gsap.from('[data-hero-in]', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.5 })
    }, section)

    ;(async () => {
      let HeroScene
      try {
        ;({ HeroScene } = await import('./HeroScene'))
      } catch {
        setWebglFailed(true)
        return
      }
      const fontFamily = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif'
      try {
        await document.fonts.load(`700 100px ${fontFamily}`)
      } catch {
        /* fall back to system font */
      }
      if (disposed) return

      let scene: InstanceType<typeof HeroScene>
      try {
        scene = new HeroScene(canvas, { mobile, fontFamily })
      } catch {
        setWebglFailed(true)
        return
      }

      const fit = () => scene.resize(canvas.clientWidth, canvas.clientHeight)
      fit()
      const ro = new ResizeObserver(fit)
      ro.observe(canvas)

      // Pointer interaction
      const onMove = (e: PointerEvent) => scene.setPointer(e.clientX, e.clientY, canvas.getBoundingClientRect())
      const onLeave = () => scene.clearPointer()
      section.addEventListener('pointermove', onMove, { passive: true })
      section.addEventListener('pointerleave', onLeave)
      section.addEventListener('pointercancel', onLeave)
      const onUp = (e: PointerEvent) => e.pointerType === 'touch' && onLeave()
      section.addEventListener('pointerup', onUp)
      // Click / tap anywhere that is not a button or link: shockwave
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return
        scene.shockwave(e.clientX, e.clientY, canvas.getBoundingClientRect())
      }
      section.addEventListener('pointerdown', onDown)

      // Only render while visible
      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? scene.start() : scene.stop()))
      io.observe(section)
      const onVis = () => (document.hidden ? scene.stop() : scene.start())
      document.addEventListener('visibilitychange', onVis)

      const gctx = gsap.context(() => {
        if (reduced) {
          scene.state.form = 1
          gsap.set('[data-hero-b]', { autoAlpha: 0 })
          return
        }
        // Galaxy spins for a moment, then collapses into the headline
        gsap.to(scene.state, { form: 1, duration: 3.2, ease: 'power3.inOut', delay: 1.1 })
        gsap.fromTo('[data-hero-hint]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 4.4 })

        // Scroll story: text → neural sphere, swap overlay copy
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: mobile ? '+=90%' : '+=130%',
            scrub: mobile ? 0.6 : 1,
            pin: true,
            anticipatePin: 1,
          },
        })
        tl.to('[data-hero-a]', { autoAlpha: 0, y: -30, duration: 0.3, ease: 'power1.in' }, 0)
          .to(scene.state, { sphere: 1, spin: Math.PI * 0.8, duration: 1, ease: 'none' }, 0)
          .fromTo('[data-hero-b]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.45)
      }, section)

      // Background particle network, deferred so the hero paints first
      const idle = (cb: () => void) =>
        'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 600)
      idle(async () => {
        if (disposed || !particlesRef.current) return
        const { mountParticles } = await import('./ParticlesBg')
        if (disposed || !particlesRef.current) return
        particlesContainer = await mountParticles(particlesRef.current, mobile)
        if (disposed) particlesContainer?.destroy()
      })

      cleanup = () => {
        ro.disconnect()
        io.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        section.removeEventListener('pointermove', onMove)
        section.removeEventListener('pointerleave', onLeave)
        section.removeEventListener('pointercancel', onLeave)
        section.removeEventListener('pointerup', onUp)
        section.removeEventListener('pointerdown', onDown)
        gctx.revert()
        scene.dispose()
      }
    })()

    return () => {
      disposed = true
      ctx.revert()
      cleanup?.()
      particlesContainer?.destroy()
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden" aria-label="Introduction">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-violet/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[420px] rounded-full bg-brand-cyan/10 blur-[110px]" />
        <div className="absolute right-0 bottom-10 h-[260px] w-[360px] rounded-full bg-brand-gold/10 blur-[110px]" />
      </div>

      <div ref={particlesRef} aria-hidden className="absolute inset-0 opacity-70 [&>canvas]:!absolute" />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full touch-pan-y" />

      <h1 className={webglFailed ? 'absolute inset-x-0 top-[34%] px-6 text-center text-5xl font-bold sm:text-7xl' : 'sr-only'}>
        <span className="text-gradient">WE ARE PRO TO TEACH AI</span>
      </h1>

      {/* State A: over the particle text */}
      <div data-hero-a className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="container-x flex flex-col items-center text-center">
          <p data-hero-in className="max-w-xl text-balance text-base text-white/70 sm:text-lg">
            Live, hands-on AI courses for Sri Lanka. Learn on Zoom, build real projects, and get ahead with the tools shaping every career.
          </p>
          <div data-hero-in className="pointer-events-auto mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/courses" className="btn btn-primary w-full sm:w-auto">
              Explore courses <ArrowRight className="size-4" />
            </Link>
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-ghost w-full sm:w-auto">
              {user ? 'Go to dashboard' : 'Create free account'}
            </Link>
          </div>
          <div data-hero-in className="mt-6 hidden items-center gap-1 text-xs text-white/40 sm:flex">
            <ChevronDown className="size-4 animate-bounce" /> Scroll
          </div>
          <p data-hero-hint className="invisible mt-3 text-xs text-white/35 sm:mt-2"><span className="sm:hidden">Tap the particles</span><span className="hidden sm:inline">Click anywhere on the particles</span></p>
        </div>
      </div>

      {/* State B: revealed on scroll next to the neural sphere */}
      <div data-hero-b className="invisible absolute inset-0 flex items-end pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:items-center md:pb-0">
        <div className="container-x">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-widest text-brand-cyan uppercase">AI is the new literacy</p>
            <h2 className="mt-3 text-3xl leading-tight font-bold text-balance sm:text-5xl">
              Learn to <span className="text-gradient">think, build and grow</span> with AI.
            </h2>
            <p className="mt-4 text-white/70 sm:text-lg">
              Four practical programs taught live by practitioners, from everyday productivity to shipping games and apps.
            </p>
            <Link to="/courses" className="btn btn-gold mt-6 w-full sm:w-auto">
              View programs <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
