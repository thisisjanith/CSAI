import { tsParticles, type Container, type ISourceOptions } from '@tsparticles/engine'
import { loadBasic } from '@tsparticles/basic'
import { loadInteractivityPlugin } from '@tsparticles/plugin-interactivity'
import { loadExternalGrabInteraction } from '@tsparticles/interaction-external-grab'
import { loadParticlesLinksInteraction } from '@tsparticles/interaction-particles-links'

let enginePromise: Promise<void> | null = null

function ensureEngine() {
  enginePromise ??= (async () => {
    await loadBasic(tsParticles)
    await loadInteractivityPlugin(tsParticles)
    await Promise.all([loadExternalGrabInteraction(tsParticles), loadParticlesLinksInteraction(tsParticles)])
  })()
  return enginePromise
}

/** particles.js-style connected network (via tsParticles, its maintained successor). */
export async function mountParticles(element: HTMLElement, mobile: boolean): Promise<Container | undefined> {
  await ensureEngine()
  const options: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: mobile ? 45 : 60,
    detectRetina: true,
    particles: {
      number: { value: mobile ? 28 : 70, density: { enable: true } },
      paint: { fill: { enable: true, color: { value: ['#22d3ee', '#8b5cf6', '#f5b83d'] } } },
      links: { enable: true, distance: mobile ? 110 : 150, color: { value: '#5b6cff' }, opacity: 0.22, width: 1 },
      move: { enable: true, speed: mobile ? 0.35 : 0.6, outModes: { default: 'out' } },
      opacity: { value: { min: 0.25, max: 0.7 } },
      size: { value: { min: 1, max: 2.4 } },
    },
    interactivity: {
      detectsOn: 'window',
      events: { onHover: { enable: !mobile, mode: 'grab' } },
      modes: { grab: { distance: 170, links: { opacity: 0.55 } } },
    },
  }
  return tsParticles.load({ element, options })
}
