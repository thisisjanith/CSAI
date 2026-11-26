import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'

/**
 * GPU particle hero.
 *   spiral galaxy  →  "WE ARE PRO TO TEACH AI"  →  neural globe
 * Extras: glow halos, light sweep across the letters, pointer repulsion,
 * click/tap shockwave, synapse lines on the globe and a twinkling starfield.
 * Morph progress is driven from outside (GSAP / ScrollTrigger) via `state`.
 */

const CAM_Z = 10

const common = /* glsl */ `
  uniform float uTime;
  uniform float uSphere;
  uniform float uSphereAngle;
  uniform vec3  uSphereCenter;

  vec3 sphereWorld(vec3 s) {
    float c = cos(uSphereAngle), si = sin(uSphereAngle);
    vec3 r = vec3(s.x * c - s.z * si, s.y, s.x * si + s.z * c);
    float t = 0.28;
    r = vec3(r.x, r.y * cos(t) - r.z * sin(t), r.y * sin(t) + r.z * cos(t));
    return r + uSphereCenter;
  }
`

const particleVertex = /* glsl */ `
  ${common}
  uniform float uForm;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uSpan;
  uniform float uGalaxyTilt;
  uniform vec3  uMouse;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  uniform vec3  uShockPos;
  uniform float uShockStart;

  attribute vec3 aText;
  attribute vec3 aSphere;
  attribute vec4 aRand;

  varying vec3 vColor;
  varying float vAlpha;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  vec3 palette(float g) {
    vec3 c1 = vec3(0.133, 0.827, 0.933);
    vec3 c2 = vec3(0.545, 0.361, 0.965);
    vec3 c3 = vec3(0.961, 0.722, 0.239);
    return g < 0.55 ? mix(c1, c2, g / 0.55) : mix(c2, c3, (g - 0.55) / 0.45);
  }

  void main() {
    float delay = aRand.x * 0.35;
    float t1 = easeInOut(clamp((uForm - delay) / 0.65, 0.0, 1.0));
    float t2 = easeInOut(clamp((uSphere - delay) / 0.65, 0.0, 1.0));

    // Galaxy: differential rotation (inner arms spin faster), then tilt
    vec3 g = position;
    float r = length(g.xz);
    float ang = uTime * (0.35 / (r * 0.6 + 0.6));
    g.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * g.xz;
    float tl = uGalaxyTilt;
    g = vec3(g.x, g.y * cos(tl) - g.z * sin(tl), g.y * sin(tl) + g.z * cos(tl));

    vec3 p = mix(g, aText, t1);
    p = mix(p, sphereWorld(aSphere), t2);

    // Breathing micro-motion (calm while the text is formed)
    float settle = t1 * (1.0 - t2);
    float amp = mix(0.06, 0.01, settle);
    p += vec3(
      sin(uTime * 0.9 + aRand.z * 6.2831),
      cos(uTime * 0.7 + aRand.y * 6.2831),
      sin(uTime * 0.6 + aRand.w * 6.2831)
    ) * amp;

    // Pointer repulsion
    vec2 diff = p.xy - uMouse.xy;
    float force = smoothstep(uMouseRadius, 0.0, length(diff)) * uMouseStrength;
    p.xy += normalize(diff + 0.0001) * force * 0.5;
    p.z  += force * 0.9;

    // Click / tap shockwave
    float st = uTime - uShockStart;
    float shock = 0.0;
    if (st > 0.0 && st < 2.6) {
      vec2 sd = p.xy - uShockPos.xy;
      float d = length(sd);
      float fade = 1.0 - st / 2.6;
      float band = exp(-pow((d - st * 5.5) * 1.5, 2.0)) * fade;
      float burst = exp(-d * d * 1.2) * pow(fade, 3.0);
      vec2 dir = normalize(sd + 0.0001);
      p.xy += dir * (band * 0.55 + burst * 1.8 * (0.5 + aRand.y));
      p.z  += (band * 1.4 + burst * 3.0) * (aRand.z - 0.35);
      shock = band + burst;
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + aRand.y * 0.9);
    gl_PointSize = size * uPixelRatio / -mv.z;

    // Colour: galaxy core hot gold, arms cyan to violet; text uses the brand gradient
    vec3 galaxyCol = mix(vec3(1.0, 0.86, 0.55), palette(0.15 + aRand.w * 0.6), smoothstep(0.0, 2.2, r));
    vec3 textCol = palette(clamp(p.x / uSpan * 0.5 + 0.5, 0.0, 1.0));
    vec3 col = mix(galaxyCol, textCol, t1);

    // Light sweep across the letters every few seconds
    float sweepX = mod(uTime * 2.4, uSpan * 5.0) - uSpan * 1.8;
    float sweep = exp(-pow((p.x - p.y * 0.35 - sweepX) * 1.4, 2.0)) * settle;

    col += vec3(sweep * 0.9 + force * 0.35 + shock * 0.6);
    vColor = col;
    vAlpha = (0.45 + aRand.w * 0.55) * mix(0.75, 1.0, max(t1, t2));
  }
`

const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.2, 0.0, d);
    float halo = exp(-d * d * 22.0) * 0.55;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (0.6 + core * 0.8), a);
  }
`

const lineVertex = /* glsl */ `
  ${common}
  attribute float aSeed;
  varying float vAlpha;
  varying float vY;
  void main() {
    vec3 p = sphereWorld(position);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float pulse = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.2 + aSeed * 40.0), 6.0);
    vAlpha = smoothstep(0.55, 1.0, uSphere) * pulse;
    vY = position.y;
  }
`

const lineFragment = /* glsl */ `
  varying float vAlpha;
  varying float vY;
  void main() {
    vec3 col = mix(vec3(0.133, 0.827, 0.933), vec3(0.545, 0.361, 0.965), clamp(vY * 0.3 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(col, vAlpha * 0.32);
  }
`

const starVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed * 2.2) * uPixelRatio;
    vAlpha = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 60.0), 3.0);
  }
`

const starFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), smoothstep(0.5, 0.0, d) * vAlpha * 0.8);
  }
`

export interface HeroSceneOptions {
  mobile: boolean
  fontFamily: string
}

export class HeroScene {
  /** form: galaxy→text (0..1), sphere: text→globe (0..1), spin: extra globe rotation */
  readonly state = { form: 0, sphere: 0, spin: 0 }

  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(45, 1, 0.1, 100)
  private group = new Group()
  private starGroup = new Group()
  private geometry = new BufferGeometry()
  private material: ShaderMaterial
  private lineGeometry = new BufferGeometry()
  private lineMaterial: ShaderMaterial
  private lines: LineSegments
  private starGeometry = new BufferGeometry()
  private starMaterial: ShaderMaterial
  private count: number
  private lineCount: number
  private sphereBase: Float32Array
  private raf = 0
  private running = false
  private t0 = performance.now()
  private mouseTarget = new Vector3(999, 999, 0)
  private mouse = new Vector3(999, 999, 0)
  private mouseStrength = 0
  private mouseActive = false
  private layoutKey = ''
  private parallax = { x: 0, y: 0 }

  constructor(
    canvas: HTMLCanvasElement,
    private opts: HeroSceneOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.count = opts.mobile ? 6000 : 16000
    this.lineCount = opts.mobile ? 450 : 1300
    this.sphereBase = new Float32Array(this.count * 3)
    this.camera.position.set(0, 0, CAM_Z)

    // Main particles
    const n = this.count
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
    this.geometry.setAttribute('aText', new BufferAttribute(new Float32Array(n * 3), 3))
    this.geometry.setAttribute('aSphere', new BufferAttribute(this.sphereBase, 3))
    const rand = new Float32Array(n * 4)
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random()
    this.geometry.setAttribute('aRand', new BufferAttribute(rand, 4))

    const shared = {
      uTime: { value: 0 },
      uSphere: { value: 0 },
      uSphereAngle: { value: 0 },
      uSphereCenter: { value: new Vector3() },
      uPixelRatio: { value: 1 },
    }

    this.material = new ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        ...shared,
        uForm: { value: 0 },
        uSize: { value: opts.mobile ? 44 : 50 },
        uSpan: { value: 6 },
        uGalaxyTilt: { value: 1.05 },
        uMouse: { value: this.mouse },
        uMouseStrength: { value: 0 },
        uMouseRadius: { value: opts.mobile ? 0.8 : 1.15 },
        uShockPos: { value: new Vector3() },
        uShockStart: { value: -100 },
      },
    })
    const points = new Points(this.geometry, this.material)
    points.frustumCulled = false
    this.group.add(points)

    // Synapse lines on the globe
    this.lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(this.lineCount * 6), 3))
    const seeds = new Float32Array(this.lineCount * 2)
    for (let i = 0; i < this.lineCount; i++) seeds[i * 2] = seeds[i * 2 + 1] = Math.random()
    this.lineGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    this.lineMaterial = new ShaderMaterial({
      vertexShader: lineVertex,
      fragmentShader: lineFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: shared,
    })
    this.lines = new LineSegments(this.lineGeometry, this.lineMaterial)
    this.lines.frustumCulled = false
    this.lines.visible = false
    this.group.add(this.lines)

    // Starfield
    const starCount = opts.mobile ? 500 : 1400
    const sp = new Float32Array(starCount * 3)
    const ss = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 70
      sp[i * 3 + 1] = (Math.random() - 0.5) * 40
      sp[i * 3 + 2] = -12 - Math.random() * 25
      ss[i] = Math.random()
    }
    this.starGeometry.setAttribute('position', new BufferAttribute(sp, 3))
    this.starGeometry.setAttribute('aSeed', new BufferAttribute(ss, 1))
    this.starMaterial = new ShaderMaterial({
      vertexShader: starVertex,
      fragmentShader: starFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: shared.uTime, uPixelRatio: shared.uPixelRatio },
    })
    const stars = new Points(this.starGeometry, this.starMaterial)
    stars.frustumCulled = false
    this.starGroup.add(stars)

    this.scene.add(this.starGroup, this.group)
  }

  /** Visible world size at z = 0 (layout reference, independent of camera dolly). */
  private get view() {
    const h = 2 * CAM_Z * Math.tan((this.camera.fov * Math.PI) / 360)
    return { w: h * this.camera.aspect, h }
  }

  resize(width: number, height: number) {
    if (!width || !height) return
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.mobile ? 1.6 : 1.75)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.material.uniforms.uPixelRatio.value = dpr * Math.min(1.25, (height / 900) ** 0.35)

    // Only rebuild formations when the layout meaningfully changes
    // (mobile URL bars change the height constantly while scrolling).
    const portrait = width / height < 0.85
    const key = `${portrait}-${Math.round(width / 80)}`
    if (key !== this.layoutKey) {
      this.layoutKey = key
      this.buildFormations(portrait)
    }
    if (!this.running) this.render()
  }

  private buildFormations(portrait: boolean) {
    const { w, h } = this.view
    const n = this.count
    const pos = this.geometry.getAttribute('position') as BufferAttribute
    const text = this.geometry.getAttribute('aText') as BufferAttribute

    // 1. Spiral galaxy (flat in XZ; tilted and rotated in the shader)
    const R = Math.max(w, h) * (portrait ? 0.55 : 0.42)
    const arms = 3
    for (let i = 0; i < n; i++) {
      const rr = Math.pow(Math.random(), 1.6) * R
      const arm = (i % arms) * ((Math.PI * 2) / arms)
      const twist = rr * 1.25
      const scatter = Math.pow(Math.random(), 2.5) * (0.25 + rr * 0.35)
      const a = arm + twist + (Math.random() - 0.5) * 0.5
      pos.setXYZ(
        i,
        Math.cos(a) * rr + (Math.random() - 0.5) * scatter,
        (Math.random() - 0.5) * 0.35 * (1 - rr / R) + (Math.random() - 0.5) * 0.08,
        Math.sin(a) * rr + (Math.random() - 0.5) * scatter,
      )
    }

    // 2. Text with a little depth so parallax reveals volume
    const lines = portrait ? ['WE ARE', 'PRO TO', 'TEACH AI'] : ['WE ARE PRO', 'TO TEACH AI']
    const maxW = Math.min(w * (portrait ? 0.9 : 0.86), 13)
    const maxH = h * (portrait ? 0.4 : 0.46)
    const yOffset = portrait ? h * 0.06 : h * 0.05
    const pts = sampleText(lines, n, maxW, maxH, this.opts.fontFamily)
    for (let i = 0; i < n; i++) text.setXYZ(i, pts[i * 3], pts[i * 3 + 1] + yOffset, pts[i * 3 + 2])
    this.material.uniforms.uSpan.value = maxW / 2

    // 3. Neural globe + orbit ring (local coordinates; rotated in the shader)
    const r = Math.min(w, h) * (portrait ? 0.3 : 0.25)
    const centre = this.material.uniforms.uSphereCenter.value as Vector3
    centre.set(portrait ? 0 : w * 0.21, portrait ? h * 0.17 : -h * 0.02, 0)
    const golden = Math.PI * (3 - Math.sqrt(5))
    const shell = Math.floor(n * 0.8)
    for (let i = 0; i < n; i++) {
      let x: number, y: number, z: number
      if (i < shell) {
        const yy = 1 - (i / (shell - 1)) * 2
        const rad = Math.sqrt(1 - yy * yy)
        const th = golden * i
        const jitter = 1 + (Math.random() - 0.5) * 0.05
        x = Math.cos(th) * rad * r * jitter
        y = yy * r * jitter
        z = Math.sin(th) * rad * r * jitter
      } else {
        const t = Math.random() * Math.PI * 2
        const rr = r * (1.38 + Math.random() * 0.18)
        x = Math.cos(t) * rr
        y = (Math.random() - 0.5) * 0.06
        z = Math.sin(t) * rr
        const tilt = 0.5
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt)
        z = y * Math.sin(tilt) + z * Math.cos(tilt)
        y = y2
      }
      this.sphereBase[i * 3] = x
      this.sphereBase[i * 3 + 1] = y
      this.sphereBase[i * 3 + 2] = z
    }

    // 4. Synapses: connect random shell points to their nearest of a few candidates
    const lp = this.lineGeometry.getAttribute('position') as BufferAttribute
    const sb = this.sphereBase
    for (let k = 0; k < this.lineCount; k++) {
      const a = (Math.random() * shell) | 0
      let best = a
      let bestD = Infinity
      for (let c = 0; c < 48; c++) {
        const b = (Math.random() * shell) | 0
        if (b === a) continue
        const dx = sb[a * 3] - sb[b * 3]
        const dy = sb[a * 3 + 1] - sb[b * 3 + 1]
        const dz = sb[a * 3 + 2] - sb[b * 3 + 2]
        const d = dx * dx + dy * dy + dz * dz
        if (d < bestD) {
          bestD = d
          best = b
        }
      }
      lp.setXYZ(k * 2, sb[a * 3], sb[a * 3 + 1], sb[a * 3 + 2])
      lp.setXYZ(k * 2 + 1, sb[best * 3], sb[best * 3 + 1], sb[best * 3 + 2])
    }

    pos.needsUpdate = true
    text.needsUpdate = true
    ;(this.geometry.getAttribute('aSphere') as BufferAttribute).needsUpdate = true
    lp.needsUpdate = true
  }

  private toWorld(clientX: number, clientY: number, rect: DOMRect) {
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1)
    const { w, h } = this.view
    return { nx, ny, x: (nx * w) / 2, y: (ny * h) / 2 }
  }

  setPointer(clientX: number, clientY: number, rect: DOMRect) {
    const { nx, ny, x, y } = this.toWorld(clientX, clientY, rect)
    this.mouseTarget.set(x, y, 0)
    this.parallax.x = nx
    this.parallax.y = ny
    if (!this.mouseActive) this.mouse.copy(this.mouseTarget)
    this.mouseActive = true
  }

  clearPointer() {
    this.mouseActive = false
  }

  /** Ripple + burst from the given screen point. */
  shockwave(clientX: number, clientY: number, rect: DOMRect) {
    const { x, y } = this.toWorld(clientX, clientY, rect)
    ;(this.material.uniforms.uShockPos.value as Vector3).set(x, y, 0)
    this.material.uniforms.uShockStart.value = (performance.now() - this.t0) / 1000
  }

  start() {
    if (this.running) return
    this.running = true
    const loop = () => {
      if (!this.running) return
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  render() {
    const t = (performance.now() - this.t0) / 1000
    const u = this.material.uniforms
    u.uTime.value = t
    u.uForm.value = this.state.form
    u.uSphere.value = this.state.sphere
    u.uSphereAngle.value = t * 0.16 + this.state.spin
    u.uGalaxyTilt.value = 1.05 - this.state.form * 0.4
    this.lines.visible = this.state.sphere > 0.5

    this.mouse.lerp(this.mouseTarget, 0.12)
    this.mouseStrength += ((this.mouseActive ? 1 : 0) - this.mouseStrength) * 0.08
    u.uMouseStrength.value = this.mouseStrength

    // Camera: gentle dolly-in during the intro + pointer parallax (auto-sway on touch devices)
    this.camera.position.z = CAM_Z + (1 - this.state.form) * 2.5
    const px = this.opts.mobile ? Math.sin(t * 0.3) * 0.25 : this.parallax.x
    const py = this.opts.mobile ? Math.cos(t * 0.25) * 0.15 : this.parallax.y
    this.group.rotation.y += (px * 0.12 - this.group.rotation.y) * 0.05
    this.group.rotation.x += (-py * 0.08 - this.group.rotation.x) * 0.05
    this.starGroup.rotation.y = this.group.rotation.y * 0.3 + t * 0.004
    this.starGroup.rotation.x = this.group.rotation.x * 0.3

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    this.geometry.dispose()
    this.material.dispose()
    this.lineGeometry.dispose()
    this.lineMaterial.dispose()
    this.starGeometry.dispose()
    this.starMaterial.dispose()
    this.renderer.dispose()
  }
}

/** Rasterise text on a 2D canvas and return `count` xyz points (world units). */
function sampleText(lines: string[], count: number, maxW: number, maxH: number, fontFamily: string) {
  const fontSize = 160
  const lineHeight = fontSize * 1.02
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const font = `700 ${fontSize}px ${fontFamily}`
  ctx.font = font
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const pad = 20
  c.width = Math.ceil(widest + pad * 2)
  c.height = Math.ceil(lineHeight * lines.length + pad * 2)
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, pad + lineHeight * (i + 0.5)))

  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
  const candidates: number[] = []
  const step = 2
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 140) candidates.push(x, y)
    }
  }

  const scale = Math.min(maxW / width, maxH / height)
  const out = new Float32Array(count * 3)
  const total = candidates.length / 2
  const idx = new Uint32Array(total)
  for (let i = 0; i < total; i++) idx[i] = i
  for (let i = total - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const tmp = idx[i]
    idx[i] = idx[j]
    idx[j] = tmp
  }
  for (let i = 0; i < count; i++) {
    const k = idx[i % total]
    const jitter = i >= total ? (Math.random() - 0.5) * step : 0
    out[i * 3] = (candidates[k * 2] + jitter - width / 2) * scale
    out[i * 3 + 1] = -(candidates[k * 2 + 1] + jitter - height / 2) * scale
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35
  }
  return out
}
