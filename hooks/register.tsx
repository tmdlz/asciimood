import { atom, read, update } from 'claude-code'
import type { BoxProps, ElementConstructor, EngineInterface, RasterProps, Register, RenderChildren, TextProps, Timer } from 'claude-code'

import { BY_ID, CATALOG, DEFAULTS, PRO, dissolve, proFrames, proSize, render, setPro, toCells } from './catalog.ts'
import type { Entry, Frame } from './catalog.ts'
import type { AgentState, AsciimoodAgent, AsciimoodPrefs, AsciimoodView } from '../types'

const PANE = 'asciimood'
const FPS = 15
const FADE_MS = 450
const DONE_TO_IDLE_MS = 45_000
// The stage (filming) asks for as much room as the layout spares.
const PANE_ROWS = 200
const SITE_URL = 'https://asciimood.com'
// The setup is chosen on the website and read back from it: every few seconds
// for a while after `/asciimood` opens the page, else now and then.
const FAST_POLL_MS = 3_000
const FAST_POLL_FOR_MS = 10 * 60_000
const SLOW_POLL_MS = 10 * 60_000

const INITIAL_PREFS: AsciimoodPrefs = { mode: 'auto', one: DEFAULTS.idle, perState: {}, isHidingTools: true }
const agent = atom({ plugin: 'asciimood', key: 'agent' } as const, { state: 'idle', detail: '' } as AsciimoodAgent)
const prefs = atom({ plugin: 'asciimood', key: 'prefs' } as const, INITIAL_PREFS)
const view = atom({ plugin: 'asciimood', key: 'view' } as const, {} as AsciimoodView)

const LABELS: Record<AgentState, string> = {
  idle: 'waiting for you',
  think: 'thinking…',
  read: 'reading files',
  write: 'writing code',
  run: 'running a command',
  error: 'hit an error',
  done: 'done',
}
const STATE_COLORS: Record<AgentState, string> = {
  idle: '#8a8578',
  think: '#c4b5fd',
  read: '#93c5fd',
  write: '#86efac',
  run: '#fcd34d',
  error: '#f87171',
  done: '#fdba74',
}
const STATES = Object.keys(LABELS) as AgentState[]
const READS = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'ToolSearch'])
const WRITES = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const THINKS = new Set(['Agent', 'Task', 'TodoWrite'])
// Tools whose row is a question for the person: never folded away.
const ASKS = new Set(['AskUserQuestion', 'ExitPlanMode'])

export const stateForTool = (tool: string): AgentState =>
  READS.has(tool) ? 'read' : WRITES.has(tool) ? 'write' : THINKS.has(tool) ? 'think' : 'run'

export const detailFor = (tool: string, input: unknown): string => {
  const i = (input ?? {}) as Record<string, unknown>
  const path = i.file_path ?? i.notebook_path ?? i.path
  if (typeof path === 'string') return `${tool} ${path.split('/').pop()}`
  if (typeof i.command === 'string') return `${tool} ${(i.command.split('\n')[0] ?? '').slice(0, 40)}`
  if (typeof i.pattern === 'string') return `${tool} "${i.pattern.slice(0, 30)}"`
  if (typeof i.description === 'string') return `${tool} ${i.description.slice(0, 40)}`
  return tool
}

const elapsed = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

type Els = { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }

/**
 * The picture in a rounded frame with `asciimood` set into its top edge, as on
 * the website; the frame turns red while Claude is stuck on an error.
 */
function framed({ Box, Text }: Els, picture: RenderChildren, W: number, state: AgentState) {
  return (
    <Box key="frame" borderStyle="round" borderColor={state === 'error' ? '#f87171' : '#4a4652'} flexDirection="column">
      {picture}
      <Box position="absolute" top={-1} left={Math.max(1, W - 10)}>
        <Text color="#f0a24a">{' asciimood '}</Text>
      </Box>
    </Box>
  )
}

/** The line under the picture: what Claude is doing, for how long, and what plays. */
function statusLine({ Box, Text }: Els, state: AgentState, detail: string, hint: string) {
  return (
    <Box key="status">
      <Text color={STATE_COLORS[state]}>● </Text>
      <Text bold>{LABELS[state]}</Text>
      <Text dimColor>{detail === '' ? '' : `  ${detail}`}</Text>
      <Text dimColor>{`  ·  ${elapsed(Date.now() - turnStartedAt)}  ·  ${current().name}${hint === '' ? '' : `  ·  ${hint}`}`}</Text>
    </Box>
  )
}

/** One place the animation is drawn: the working line, or the stage. */
type Site = { requestId: string; W: number; H: number; isMounted: boolean; shown?: Frame; shownId: string; fade?: { from: Frame; at: number } }

// What the frame clock reads. Drawings read the atoms, so they redraw on a
// change; these mirror them for the timer, which runs outside any hook. A
// hot reload loads the module afresh and session.start fills them again.
let now: AsciimoodAgent = { state: 'idle', detail: '' }
let chosen: AsciimoodPrefs = INITIAL_PREFS
let device = ''
let shuffled: string | undefined
let playhead = 0
let lastTick = Date.now()
let turnStartedAt = Date.now()
let idleTimer: Timer | undefined
let fastPoll: Timer | undefined
let fastPollUntil = 0
// Filming: `/asciimood demo` plays a made-up session, `/asciimood tour` walks the
// library. Both run in the plugin alone (no model, no tokens), leave the person's
// setup untouched, and stop at `/asciimood stop` or when a real turn starts.
let reel: Timer | undefined
let isPaneOpen = false
let touring: string | undefined
// `clean` hides the frame and the status line, so the animation fills the stage.
let isClean = false
// `/asciimood play <animation>` waits for the next prompt, then pins that animation for a
// while, so a person can film the usual Claude Code screen: a prompt typed, the animation answering.
let isPinned = false
let armed: { id: string, ms: number } | undefined
const DEMO: [AgentState, string, number][] = [
  ['think', '', 3500], ['read', 'Read Dashboard.tsx', 3500], ['write', 'Edit theme.css', 4000], ['run', 'Bash npm test', 4000],
  ['error', '1 test failed', 3000], ['think', '', 2500], ['write', 'Edit Dashboard.tsx', 3000], ['run', 'Bash npm test', 3000], ['done', '', 5000],
]
const sites = new Map<string, Site>()

const currentId = (): string => {
  if (touring !== undefined) return touring
  if (chosen.mode === 'one') return chosen.one
  if (chosen.mode === 'shuffle' && shuffled !== undefined) return shuffled
  return chosen.perState[now.state] ?? DEFAULTS[now.state]
}
/** The item `i` places along `list`, wrapping round both ends. */
const wrapAt = <T,>(list: readonly T[], i: number): T => list[((i % list.length) + list.length) % list.length] as T
const current = (): Entry => BY_ID.get(currentId()) ?? wrapAt(CATALOG, 0)

// Pro frames asked of asciimood.com, by `<id>@<size>`, and when: a refusal waits a minute.
const asked = new Map<string, number>()
const PRO_RETRY_MS = 60_000
const PRO_KEEP = 6

/** Whether a Pro animation's frames for W x H are here; if not, asks for them. */
function hasFrames($: EngineInterface, entry: Entry, W: number, H: number): boolean {
  const size = proSize(W, H)
  const key = `${entry.id}@${size}`
  if (proFrames.has(key)) return true
  if (Date.now() - (asked.get(key) ?? 0) < PRO_RETRY_MS) return false
  asked.set(key, Date.now())
  void $.http.fetch(`${SITE_URL}/api/pro/frames/${entry.id}/${size}?d=${device}`).then(got => {
    if (!got.ok) return
    const oldest = proFrames.keys().next()
    if (proFrames.size >= PRO_KEEP && oldest.done !== true) proFrames.delete(oldest.value)
    proFrames.set(key, got.text.split('\f').map(frame => frame.split('\n')))
  }).catch(() => undefined)
  return false
}

const frameFor = ($: EngineInterface, site: Site): Frame => {
  let entry = current()
  // A Pro animation plays once its frames for this size are here: the state's default till then.
  if (entry.pro === true && !hasFrames($, entry, site.W, site.H)) entry = BY_ID.get(DEFAULTS[now.state]) ?? wrapAt(CATALOG, 0)
  const frame = render(entry, playhead, site.W, site.H)
  if (site.shown !== undefined && entry.id !== site.shownId) site.fade = { from: site.shown, at: Date.now() }
  site.shownId = entry.id
  let out = frame
  if (site.fade !== undefined) {
    const k = (Date.now() - site.fade.at) / FADE_MS
    if (k >= 1) site.fade = undefined
    else out = dissolve(site.fade.from, frame, k, site.W)
  }
  site.shown = out
  return out
}

/** The site for a drawing of `requestId` at W x H, started afresh on a resize. */
const siteFor = (requestId: string, W: number, H: number): Site => {
  const had = sites.get(requestId)
  if (had !== undefined && had.W === W && had.H === H) {
    had.isMounted = true
    return had
  }
  const site: Site = { requestId, W, H, isMounted: true, shownId: '' }
  sites.set(requestId, site)
  return site
}

let lastSecond = 0
async function tick($: EngineInterface) {
  const at = Date.now()
  // The status line shows the turn's elapsed time: redraw it once a second.
  const second = Math.floor(at / 1000)
  if (second !== lastSecond && now.state !== 'idle' && now.state !== 'done') $.ui.invalidate('ui.render')
  lastSecond = second
  playhead += (at - lastTick) / 1000
  lastTick = at
  for (const site of sites.values()) {
    if (!site.isMounted) continue
    const { W, H } = site
    const blitted = await $.ui.blit({ requestId: site.requestId, key: 'art', columns: W, rows: H, cells: toCells(frameFor($, site), W, H) })
    if (blitted.deny !== undefined) sites.delete(site.requestId)
  }
}

async function setAgent($: EngineInterface, state: AgentState, detail = '') {
  if (state !== now.state && chosen.mode === 'shuffle') {
    const others = [...CATALOG, ...PRO].filter(entry => entry.id !== currentId())
    shuffled = wrapAt(others, Math.floor(Math.random() * others.length)).id
  }
  now = { state, detail }
  await update($, agent, () => now)
  $.ui.status(LABELS[state])
  idleTimer?.cancel()
  idleTimer = undefined
  if (state === 'done') {
    idleTimer = $.clock.after(DONE_TO_IDLE_MS, () => {
      if (now.state === 'done') void setAgent($, 'idle')
    })
  }
}

function stopReel() {
  reel?.cancel()
  reel = undefined
  touring = undefined
  isClean = false
  isPinned = false
}
const PLAY_SECONDS = 30
/** The animation a person named: its id, or its name in any case, spaces or dashes. */
function named(words: string[]): Entry | undefined {
  const key = words.join(' ').replace(/[\s_-]+/g, ' ').trim()
  if (key === '') return undefined
  const all = [...CATALOG, ...PRO]
  const flat = (entry: Entry) => [entry.id.replace(/-/g, ' '), entry.name.toLowerCase().replace(/-/g, ' ')]
  return all.find(entry => flat(entry).includes(key)) ?? all.find(entry => flat(entry).some(n => n.startsWith(key)))
}
function playDemo($: EngineInterface, i = 0) {
  const [state, detail, ms] = wrapAt(DEMO, i)
  void setAgent($, state, detail)
  reel = $.clock.after(ms, () => playDemo($, i + 1))
}
function playTour($: EngineInterface, list: Entry[], ms: number, i = 0) {
  touring = wrapAt(list, i).id
  void setAgent($, now.state, wrapAt(list, i).name)
  reel = $.clock.after(ms, () => playTour($, list, ms, i + 1))
}

/**
 * A setup as asciimood.com stores it, made safe: only known modes, states and
 * animations get through, and anything else keeps its default.
 */
export function cleanSetup(raw: unknown): AsciimoodPrefs | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const r = raw as Record<string, unknown>
  const mode = r.mode === 'one' || r.mode === 'shuffle' ? r.mode : 'auto'
  const perState: Record<string, string> = {}
  const per = (typeof r.perState === 'object' && r.perState !== null ? r.perState : {}) as Record<string, unknown>
  for (const state of STATES) {
    const id = per[state]
    if (typeof id === 'string' && BY_ID.has(id)) perState[state] = id
  }
  const one = typeof r.one === 'string' && BY_ID.has(r.one) ? r.one : INITIAL_PREFS.one
  return { mode, one, perState, isHidingTools: r.isHidingTools !== false }
}

/** This install's anonymous id, made once: the website keeps the setup under it. */
async function ensureDevice($: EngineInterface): Promise<string> {
  if (device !== '') return device
  const saved = (await $.store.get('device')) as unknown
  device = typeof saved === 'string' && /^[0-9a-f-]{36}$/.test(saved) ? saved : crypto.randomUUID()
  if (device !== saved) await $.store.set('device', device)
  return device
}

const setupUrl = (): string => `${SITE_URL}/setup/#d=${device}`

/** The Pro catalogue asciimood.com sends a licensed device (none once the license is gone), kept for next time. */
async function takePro($: EngineInterface, catalog: unknown) {
  const was = JSON.stringify((await $.store.get('pro')) ?? null)
  if (JSON.stringify(catalog ?? null) === was) return
  setPro(catalog)
  await $.store.set('pro', catalog ?? null)
}

/** Turns Pro on for this device with the key from the purchase email; says how it went. */
async function activate($: EngineInterface, key: string): Promise<string> {
  await ensureDevice($)
  try {
    const got = await $.http.fetch(`${SITE_URL}/api/pro/activate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device, key }) })
    const body = JSON.parse(got.text) as { pro?: boolean; reason?: string }
    if (got.ok && body.pro === true) {
      await pull($)
      return `Asciimood Pro is on. Pick your Pro animations: /asciimood\n${setupUrl()}`
    }
    return {
      limit: 'Asciimood: this key is already on 3 computers.',
      unknown: 'Asciimood: this key is not known. Check it was copied whole.',
      format: 'Asciimood: that does not look like a license key.',
    }[body.reason ?? ''] ?? 'Asciimood: could not reach the license server. Try again in a minute.'
  } catch {
    return 'Asciimood: could not reach asciimood.com. Try again in a minute.'
  }
}

/** Reads this device's setup from asciimood.com; resolves whether it changed. */
async function pull($: EngineInterface): Promise<boolean> {
  await ensureDevice($)
  let next: AsciimoodPrefs | undefined
  try {
    const got = await $.http.fetch(`${SITE_URL}/api/setup/${device}`)
    const body = JSON.parse(got.text) as { setup?: unknown; pro?: { catalog?: unknown } }
    await takePro($, body.pro?.catalog)
    if (!got.ok) return false
    next = cleanSetup(body.setup)
  } catch {
    return false // offline: keep what we have
  }
  if (next === undefined || JSON.stringify(next) === JSON.stringify(chosen)) return false
  chosen = next
  shuffled = undefined
  await update($, prefs, () => chosen)
  await $.store.set('prefs', chosen)
  return true
}

function pollFast($: EngineInterface) {
  fastPollUntil = Date.now() + FAST_POLL_FOR_MS
  if (fastPoll !== undefined) return
  fastPoll = $.clock.every(FAST_POLL_MS, () => {
    if (Date.now() > fastPollUntil) {
      fastPoll?.cancel()
      fastPoll = undefined
      return
    }
    void pull($).then(changed => {
      if (changed) $.ui.toast(`Asciimood: your setup from asciimood.com is on (${describe()}).`)
    })
  })
}

const describe = (): string =>
  chosen.mode === 'one' ? `${BY_ID.get(chosen.one)?.name} for everything`
  : chosen.mode === 'shuffle' ? 'shuffle'
  : `${BY_ID.get(chosen.perState.think ?? DEFAULTS.think)?.name} while thinking…`

/** Opens the setup page in the person's browser; resolves whether it could. */
async function openInBrowser($: EngineInterface, url: string): Promise<boolean> {
  const isWindows = (await $.env.get('OS')) === 'Windows_NT'
  const tries: string[][] = isWindows ? [['cmd', '/c', 'start', '', url]] : [['open', url], ['xdg-open', url]]
  for (const argv of tries) {
    try {
      if ((await $.process.run(argv, { timeoutMs: 5_000 })).exitCode === 0) return true
    } catch {
      // not on this system: try the next
    }
  }
  return false
}

async function closeStage($: EngineInterface) {
  await update($, view, () => ({ isOpen: false }))
  if (isPaneOpen) await $.ui.close({ id: PANE })
  isPaneOpen = false
}

/** The stage while filming: the framed animation and its line, or (clean) the animation alone, filling the room. */
async function stage($: EngineInterface, els: Els & { Raster: ElementConstructor<RasterProps> }, requestId: string, columns: number, rows: number) {
  const { state, detail } = await read($, agent)
  const { Box, Raster } = els
  const art = (W: number, H: number) => {
    const site = siteFor(requestId, W, H)
    return <Raster key="art" columns={W} rows={H} cells={toCells(site.shown ?? frameFor($, site), W, H)} />
  }
  if (isClean) {
    const W = Math.max(20, Math.min(512, columns))
    const H = Math.max(6, Math.min(254, rows))
    return <Box key="clean">{art(W, H)}</Box>
  }
  const W = Math.max(20, Math.min(512, columns - 2))
  const H = Math.max(6, Math.min(254, rows - 3))
  return (
    <Box flexDirection="column">
      {framed(els, art(W, H), W, state)}
      {statusLine(els, state, detail, '/asciimood stop to end')}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    setPro(await $.store.get('pro')) // before the setup, which may play Pro animations
    const saved = (await $.store.get('prefs')) as unknown
    chosen = cleanSetup(saved) ?? (await read($, prefs))
    await update($, prefs, () => chosen)
    now = await read($, agent)
    await ensureDevice($)
    await $.command.register({
      name: 'asciimood',
      description: 'Choose your Asciimood animations on asciimood.com (or: your Pro key to turn Pro on; demo, tour, stop to film)',
      argumentHint: '[pro key|play <animation> [seconds]|demo|tour [seconds] [clean]|stop]',
    })
    $.clock.every(Math.round(1000 / FPS), () => void tick($))
    $.clock.every(SLOW_POLL_MS, () => void pull($))
    void pull($)
    $.ui.status(LABELS[now.state])

    return next(e)
  })

  on('command.run', { command: 'asciimood' }, async ($, e) => {
    // `/asciimood <key>` (or `/asciimood activate <key>`): the Pro key from the purchase, as typed
    const key = /\bASCIIMOOD[-_][0-9A-Za-z-]{8,}/i.exec(e.args)?.[0] ?? (/^\s*activate\s+(\S{8,})/i.exec(e.args)?.[1])
    if (key !== undefined) return { text: await activate($, key) }
    const [verb = '', ...rest] = e.args.trim().toLowerCase().split(/\s+/)
    if (verb === 'stop') {
      stopReel()
      armed = undefined
      await setAgent($, 'idle')
      await closeStage($)
      return { text: 'Asciimood: filming stopped.' }
    }
    if (verb === 'play') {
      const seconds = Number(rest.find(word => /^\d+(\.\d+)?$/.test(word)) ?? PLAY_SECONDS)
      const entry = named(rest.filter(word => word !== 'clean' && !/^\d+(\.\d+)?$/.test(word)))
      if (entry === undefined) {
        const names = [...CATALOG, ...PRO].map(e => e.id).join(', ')
        return { text: `Asciimood: which one? /asciimood play <animation> [seconds]\n${names}` }
      }
      armed = { id: entry.id, ms: Math.max(1, seconds) * 1000 }
      return { text: `Asciimood: ${entry.name} is ready. Type your prompt: it plays for ${seconds} s while Claude works.` }
    }
    if (verb === 'demo' || verb === 'tour') {
      if (verb === 'demo') { stopReel(); playDemo($) }
      else if (verb === 'tour') {
        stopReel()
        const seconds = Number(rest.find(word => /^\d+(\.\d+)?$/.test(word)) ?? 4)
        isClean = rest.includes('clean')
        playTour($, CATALOG, Math.max(1, seconds) * 1000)
      }
      if (e.presentation?.isFullscreen !== true) {
        await update($, view, () => ({ isOpen: true }))
        return { text: 'Asciimood is filming above the prompt: /asciimood stop to end.' }
      }
      const opened = await $.ui.open({ id: PANE, title: 'Asciimood', rows: PANE_ROWS, columns: Math.max(80, (e.presentation?.columns ?? 120) - 4) })
      isPaneOpen = true
      return { text: opened.isPlaced ? 'Asciimood is filming: /asciimood stop to end.' : 'Asciimood is waiting for a wider terminal.' }
    }
    if (verb !== '') return { text: `Asciimood is set up on the website now: ${setupUrl()}` }

    await ensureDevice($)
    const isOpen = await openInBrowser($, setupUrl())
    pollFast($)
    return {
      text: isOpen
        ? `Asciimood: choose your animations in the page that just opened. They play here as soon as you save.\n${setupUrl()}`
        : `Asciimood: open this page to choose your animations. They play here as soon as you save.\n${setupUrl()}`,
    }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      // a pinned animation carries on through the turn, in the working line; anything else stops
      if (reel !== undefined && !isPinned) {
        stopReel()
        await closeStage($)
      }
      if (armed !== undefined) {
        // the armed animation plays in the working line, then the setup's own takes over
        stopReel()
        touring = armed.id
        isPinned = true
        reel = $.clock.after(armed.ms, stopReel)
        armed = undefined
      }
      turnStartedAt = Date.now()
      await setAgent($, 'think')
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    const isMain = (e as { agentId?: string }).agentId === undefined
    if (isMain) await setAgent($, stateForTool(tool), detailFor(tool, (e as { input?: unknown }).input))
    const ran = await next(e)
    if (isMain && ran.isError === true) await setAgent($, 'error', `${tool} failed`)

    return ran
  }).catch(($, e, next) => next(e)) // never stand in the way of a tool call

  on('turn.complete', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) {
      if (e.reason === 'error') await setAgent($, 'error', 'the turn failed')
      else if (e.isAborted) await setAgent($, 'idle')
      else await setAgent($, 'done', elapsed(e.durationMs))
    }

    return next(e)
  })

  // While a turn runs: the animation in place of the working line, across the
  // window's width and all its height but the prompt, the footer and our line.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    await read($, prefs)
    const { state, detail } = await read($, agent)
    if (e.surface !== 'terminal') return next(e)
    const els = $.ui.resolve(e)
    const { Box, Raster } = els
    const columns = e.viewport?.columns ?? 80
    const rows = e.viewport?.rows ?? 24
    const W = Math.max(20, Math.min(512, columns - 4))
    const H = Math.max(8, Math.min(254, rows - 10))
    const site = siteFor(e.requestId, W, H)

    return (
      <Box flexDirection="column">
        {framed(els, <Raster key="art" columns={W} rows={H} cells={toCells(site.shown ?? frameFor($, site), W, H)} />, W, state)}
        {statusLine(els, state, detail, '/asciimood to change')}
      </Box>
    )
  })

  // The code and output Claude produces fold into one quiet line, unless the
  // call failed or asks the person something: those always show in full.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const p = await read($, prefs)
    if (!p.isHidingTools || e.props.isErrored || ASKS.has(e.props.tool)) return next(e)
    const { Text } = $.ui.resolve(e)

    return <Text dimColor>{`  ${e.props.isRunning ? '◌' : '·'} ${detailFor(e.props.tool, e.props.input)}`}</Text>
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const p = await read($, prefs)
    if (!p.isHidingTools || e.props.isErrored || ASKS.has(e.props.tool)) return next(e)
    const { Box } = $.ui.resolve(e)

    return <Box />
  })

  // On the main screen the stage is the band above the prompt, which may take
  // the terminal's whole height; in the fullscreen layout it is a docked pane.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const v = await read($, view)
    if (v.isOpen !== true || e.props.hasSurvey || e.surface !== 'terminal') return next(e)
    return stage($, $.ui.resolve(e), 'stage', e.props.bodyColumns, e.props.maxRows - 1)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface !== 'terminal') {
      const { Text } = $.ui.resolve(e)
      return <Text>Asciimood plays in the terminal.</Text>
    }
    return stage($, $.ui.resolve(e), PANE, e.props.bodyColumns, e.props.scroll.bodyRows)
  })
}
