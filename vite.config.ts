import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  // Pre-bundle everything up front so lazily-imported pages never trigger a re-optimise
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 'react-router', '@supabase/supabase-js', 'sonner', 'lucide-react',
      'three', 'gsap', 'gsap/ScrollTrigger', 'lenis',
      '@tsparticles/engine', '@tsparticles/basic', '@tsparticles/plugin-interactivity',
      '@tsparticles/interaction-external-grab', '@tsparticles/interaction-particles-links',
    ],
  },
})
