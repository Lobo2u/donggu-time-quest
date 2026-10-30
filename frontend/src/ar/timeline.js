import { validateTimeline } from './manifest.js'

export const INITIAL_SCENES = Object.freeze([
  { name: '건물의 각성', start: 0, end: 20 },
  { name: '캐릭터 등장', start: 20, end: 40 },
  { name: '뮤지컬 공연', start: 40, end: 100 },
  { name: '피날레', start: 100, end: 120 },
])

// This scenario uses only supplied architectural anchors and authored character routes.
export function createInitialTimeline(manifest) {
  const cues = []
  const add = (effect, anchor, start, end, extras = {}) => cues.push({
    id: `cue-${cues.length}`, effect, anchorId: anchor.id,
    start, end, color: '#ffe6a1', intensity: 0.85, ...extras,
  })
  const windows = manifest.anchors.filter(a => a.kind === 'window')
  windows.forEach((anchor, i) => add('window-light', anchor, 1 + i / Math.max(1, windows.length) * 14, 40))
  for (const anchor of manifest.anchors) {
    if (anchor.kind === 'outline') {
      add('outline-flow', anchor, 3, 20)
      add('outline-flow', anchor, 100, 120)
    }
    if (anchor.kind === 'window' || anchor.kind === 'wall') {
      add(anchor.kind === 'window' ? 'window-light' : 'wall-wash', anchor, 40, 100, { color: '#80cfff', pulseHz: 1 })
      add(anchor.kind === 'window' ? 'window-light' : 'wall-wash', anchor, 100, 120)
    }
    if (anchor.kind === 'roof') {
      add('stars', anchor, 6, 20, { count: 48, motion: 'gather' })
      add('stars', anchor, 100, 120, { count: 80, motion: 'spread' })
      add('roof-beam', anchor, 104, 120)
    }
  }
  for (const character of manifest.characters) {
    const entry = manifest.anchors.find(a => a.id === character.route[0])
    add('character', entry, 20, 40, { characterId: character.id, routeMode: 'forward', emergeSeconds: 1.2 })
    add('character', entry, 40, 100, { characterId: character.id, routeMode: 'ping-pong', cycleSeconds: 24,
      startAtEnd: true, clipOffsetSeconds: 20 })
  }
  const timeline = { duration: 120, scenes: INITIAL_SCENES.map(s => ({ ...s })), cues }
  const errors = validateTimeline(timeline, manifest.anchors, manifest.characters)
  if (errors.length) throw new Error(errors.join('\n'))
  return timeline
}

export function sampleTimeline(timeline, seconds) {
  const time = Math.min(timeline.duration, Math.max(0, seconds))
  const scene = timeline.scenes.find(s => time >= s.start && time < s.end) ?? null
  const cues = []
  for (const cue of timeline.cues) {
    if (time < cue.start || time >= cue.end) continue
    const elapsed = time - cue.start
    const duration = cue.end - cue.start
    const progress = elapsed / duration
    const fade = Math.min(1, elapsed / 0.6, (duration - elapsed) / 0.6)
    const pulse = cue.pulseHz ? 0.75 + 0.25 * Math.sin(elapsed * Math.PI * 2 * cue.pulseHz) : 1
    cues.push({ ...cue, elapsed, progress, strength: fade * cue.intensity * pulse })
  }
  return { time, scene, cues }
}

export function sampleRoute(points, progress) {
  if (points.length < 2) throw new Error('이동 경로에 두 개 이상의 앵커가 필요합니다.')
  const lengths = points.slice(1).map((p, i) => Math.hypot(...p.map((n, axis) => n - points[i][axis])))
  const total = lengths.reduce((sum, n) => sum + n, 0)
  let distance = Math.max(0, Math.min(1, progress)) * total
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0
      return points[i].map((n, axis) => n + (points[i + 1][axis] - n) * t)
    }
    distance -= lengths[i]
  }
  return [...points.at(-1)]
}

// Audio is the master clock: buffering, seeking and background suspension cannot
// leave the animation running ahead of the soundtrack.
export class PerformanceClock {
  constructor(duration, audio = null, now = () => performance.now() / 1000) {
    this.duration = duration
    this.audio = audio
    this.now = now
    this.state = 'stopped'
    this.offset = 0
    this.startedAt = 0
    this.generation = 0
  }

  get time() {
    const seconds = this.audio ? this.audio.currentTime
      : this.offset + (this.state === 'playing' ? this.now() - this.startedAt : 0)
    return Math.max(0, Math.min(this.duration, Number.isFinite(seconds) ? seconds : 0))
  }

  async play() {
    if (this.state === 'playing') return
    if (this.time >= this.duration) this.seek(0)
    const generation = ++this.generation
    if (this.audio) await this.audio.play()
    if (generation !== this.generation) {
      if (this.state !== 'playing') this.audio?.pause()
      return
    }
    this.startedAt = this.now()
    this.state = 'playing'
  }

  pause() {
    this.offset = this.time
    this.generation++
    this.audio?.pause()
    this.state = 'paused'
  }

  seek(seconds) {
    if (!Number.isFinite(seconds)) throw new Error('공연 시간은 유한한 숫자여야 합니다.')
    this.offset = Math.max(0, Math.min(this.duration, seconds))
    this.startedAt = this.now()
    if (this.audio) this.audio.currentTime = this.offset
  }

  stop() {
    this.pause()
    this.seek(0)
    this.state = 'stopped'
  }

  sample(timeline) {
    const time = this.time
    if (time >= this.duration && this.state === 'playing') this.pause()
    return sampleTimeline(timeline, time)
  }
}
