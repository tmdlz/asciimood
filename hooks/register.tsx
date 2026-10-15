import { atom, read, update } from 'claude-code'
import type { BoxProps, ButtonProps, ElementConstructor, EngineInterface, LinkProps, Register, RenderChildren, TextProps, Timer } from 'claude-code'

import { BY_ID, CATALOG, CATEGORIES, DEFAULTS, dissolve, render, toCells } from './catalog.ts'
import type { Entry, Frame } from './catalog.ts'
import type { AgentState, AsciimoodAgent, AsciimoodPrefs, AsciimoodView } from '../types'

const PANE = 'asciimood'
const FPS = 15
const FADE_MS = 450
const DONE_TO_IDLE_MS = 45_000
// How tall the picker asks to open above the prompt: the picture and its controls.
// The picker asks for as much room as the layout spares; the dock, the width beside a narrow transcript.
const PANE_ROWS = 200
const SIDEBAR = 24
const SITE_URL = 'https://asciimood.com'

const INITIAL_PREFS: AsciimoodPrefs = { mode: 'auto', one: 'sleeping-cat', perState: {}, isPaused: false, isHidingTools: true }
const agent = atom({ plugin: 'asciimood', key: 'agent' } as const, { state: 'idle', detail: '' } as AsciimoodAgent)
const prefs = atom({ plugin: 'asciimood', key: 'prefs' } as const, INITIAL_PREFS)
const view = atom({ plugin: 'asciimood', key: 'view' } as const, { cat: '', offset: 0 } as AsciimoodView)

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

/**
 * The picture in a rounded frame with `asciimood` set into its top edge, as on
 * the website; the frame turns red while Claude is stuck on an error.
 */
function framed(els: { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }, picture: RenderChildren, W: number, state: AgentState) {
  const { Box, Text } = els
  return (
    <Box key="frame" borderStyle="round" borderColor={state === 'error' ? '#f87171' : '#4a4652'} flexDirection="column">
      {picture}
      <Box position="absolute" top={-1} left={Math.max(1, W - 10)}>
        <Text color="#f0a24a">{' asciimood '}</Text>
      </Box>
    </Box>
  )
}

type PickerElements = {
  Box: ElementConstructor<BoxProps>
  Text: ElementConstructor<TextProps>
  Button: ElementConstructor<ButtonProps>
  Link: ElementConstructor<LinkProps>
}
const ACCENT = '#f0a24a'

/**
 * The picker, after ascii.rest: shelves across the top, the shelf's pieces
 * down the left, the piece large on the right with its name and what it shows.
 * Sized to `columns` x `rows`; `raster` draws the live picture at a size.
 */
async function drawPicker($: EngineInterface, els: PickerElements, raster: ((W: number, H: number) => RenderChildren) | undefined, columns: number, rows: number, hint: string) {
  const { Box, Text, Button, Link } = els
  const { state, detail } = await read($, agent)
  const p = await read($, prefs)
  const v = await read($, view)
  now = { state, detail }
  chosen = p

  const entry = current()
  const hasSidebar = columns >= 70
  const W = Math.max(20, Math.min(512, (hasSidebar ? columns - SIDEBAR - 2 : columns) - 2))
  // Three rows above (title, actions, shelves), four under (name, note, mode, link), the frame's two.
  const H = Math.max(6, Math.min(254, rows - 9))

  // The shelf shown: the one browsed, else the playing piece's own.
  const cat = CATEGORIES.includes(v.cat) ? v.cat : entry.cat
  const shelf = CATALOG.filter(one => one.cat === cat)
  const room = Math.max(3, H)
  let offset = Math.min(v.offset, Math.max(0, shelf.length - room))
  const at = shelf.findIndex(one => one.id === entry.id)
  // Following the playing piece (no shelf picked by hand): keep it in view.
  if (v.cat === '' && at >= 0 && (at < offset || at >= offset + room)) offset = Math.max(0, Math.min(at - 1, shelf.length - room))
  const scrollTo = (n: number) => update($, view, w => ({ ...w, cat, offset: Math.max(0, Math.min(n, shelf.length - room)) }))
  const close = async () => {
    await update($, view, w => ({ ...w, isOpen: false }))
    await $.ui.close({ id: PANE })
  }
  const action = (key: string, hotkey: string, label: string, onPress: () => unknown, color?: string) => (
    <Button key={key} plain hotkey={hotkey} onPress={onPress}>
      <Text color={color}>{label}</Text>
    </Button>
  )

  const title = (
    <Box key="title" justifyContent="space-between">
      <Box columnGap={2}>
        <Text bold color={ACCENT}>asciimood</Text>
        <Text dimColor>{`${CATALOG.length} pieces · Claude is ${LABELS[state]}${p.isPaused ? ' · paused' : ''}`}</Text>
      </Box>
      <Text dimColor>{hint}</Text>
    </Box>
  )
  const actions = (
    <Box key="actions" columnGap={3}>
      {action('prev', 'a', '◀ prev', () => step($, -1))}
      {action('next', 'd', 'next ▶', () => step($, 1))}
      {action('random', 'r', 'random', () => pickRandom($), ACCENT)}
      {action('pause', 'p', p.isPaused ? 'play' : 'pause', () => setPrefs($, q => ({ ...q, isPaused: !q.isPaused })))}
      {action('tools', 't', p.isHidingTools ? 'show code' : 'hide code', () => setPrefs($, q => ({ ...q, isHidingTools: !q.isHidingTools })))}
      {action('close', 'x', '× close', close, 'red')}
    </Box>
  )
  const shelves = (
    <Box key="shelves" columnGap={2} flexWrap="wrap">
      {CATEGORIES.map(one => (
        <Button key={`cat-${one}`} plain onPress={() => update($, view, w => ({ ...w, cat: one, offset: 0 }))}>
          <Text color={one === cat ? ACCENT : undefined} bold={one === cat} dimColor={one !== cat}>
            {`${one} ${CATALOG.filter(x => x.cat === one).length}`}
          </Text>
        </Button>
      ))}
    </Box>
  )

  const visible = shelf.slice(offset, offset + room)
  const sidebar = (
    <Box key="list" flexDirection="column" width={SIDEBAR} paddingTop={1}>
      {offset > 0 && (
        <Button key="up" plain onPress={() => scrollTo(offset - room)}>
          <Text dimColor>{`  ▲ ${offset} more`}</Text>
        </Button>
      )}
      {visible.map(one => (
        <Button key={`anim-${one.id}`} plain onPress={() => choose($, one.id)}>
          {one.id === entry.id ? (
            <Text color={ACCENT} bold>{`› ${one.name}`.slice(0, SIDEBAR)}</Text>
          ) : (
            <Text>{`  ${one.name}`.slice(0, SIDEBAR)}</Text>
          )}
        </Button>
      ))}
      {offset + room < shelf.length && (
        <Button key="down" plain onPress={() => scrollTo(offset + room)}>
          <Text dimColor>{`  ▼ ${shelf.length - offset - room} more`}</Text>
        </Button>
      )}
    </Box>
  )

  const modes: [AsciimoodPrefs['mode'], string][] = [['auto', 'one per state'], ['one', 'same for all'], ['shuffle', 'shuffle']]
  const caption = (
    <Box key="caption" flexDirection="column">
      <Box columnGap={2}>
        <Text bold>{entry.name}</Text>
        <Text dimColor>{entry.piece !== undefined ? `${entry.by} · MIT` : entry.by}</Text>
      </Box>
      <Text dimColor>{entry.note}</Text>
      <Box columnGap={1}>
        <Text dimColor>mode</Text>
        {modes.map(([value, label]) => (
          <Button key={`mode-${value}`} plain onPress={() => setPrefs($, q => ({ ...q, mode: value, one: currentId() }))}>
            <Text color={p.mode === value ? ACCENT : undefined} dimColor={p.mode !== value}>{`[${label}]`}</Text>
          </Button>
        ))}
        <Text dimColor>{p.mode === 'auto' ? `· your pick plays while Claude is ${LABELS[state]}` : ''}</Text>
      </Box>
      <Box columnGap={1}>
        <Text dimColor>more animations and packs:</Text>
        <Link href={SITE_URL} label="asciimood website ↗" />
      </Box>
    </Box>
  )
  const picture =
    raster !== undefined ? framed(els, raster(W, H), W, state) : <Text key="art">{render(entry, playhead, W, H).chars.join('\n')}</Text>

  return (
    <Box flexDirection="column">
      {title}
      {actions}
      {shelves}
      <Box columnGap={2}>
        {hasSidebar && sidebar}
        <Box flexDirection="column">
          {picture}
          {caption}
        </Box>
      </Box>
    </Box>
  )
}

/** One place the animation is drawn: the pane, or the working line. */
type Site = { requestId: string; W: number; H: number; isMounted: boolean; shown?: Frame; shownId: string; fade?: { from: Frame; at: number } }

// What the frame clock reads. Drawings read the atoms, so they redraw on a
// change; these mirror them for the timer, which runs outside any hook. A
// hot reload loads the module afresh and session.start fills them again.
let now: AsciimoodAgent = { state: 'idle', detail: '' }
let chosen: AsciimoodPrefs = INITIAL_PREFS
let shuffled: string | undefined
let playhead = 0
let lastTick = Date.now()
let turnStartedAt = Date.now()
let idleTimer: Timer | undefined
// Filming: `/asciimood demo` plays a made-up session, `/asciimood tour` walks the
// library. Both run in the plugin alone (no model, no tokens), leave the person's
// setup untouched, and stop at `/asciimood stop` or when a real turn starts.
let reel: Timer | undefined
let touring: string | undefined
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

const frameFor = (site: Site): Frame => {
  const entry = current()
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
  // The working line shows the turn's elapsed time: redraw it once a second.
  const second = Math.floor(at / 1000)
  if (second !== lastSecond && now.state !== 'idle' && now.state !== 'done') $.ui.invalidate('ui.render')
  lastSecond = second
  if (!chosen.isPaused) playhead += (at - lastTick) / 1000
  lastTick = at
  for (const site of sites.values()) {
    if (!site.isMounted) continue
    const { W, H } = site
    const blitted = await $.ui.blit({ requestId: site.requestId, key: 'art', columns: W, rows: H, cells: toCells(frameFor(site), W, H) })
    if (blitted.deny !== undefined) sites.delete(site.requestId)
  }
}

async function setAgent($: EngineInterface, state: AgentState, detail = '') {
  if (state !== now.state && chosen.mode === 'shuffle') {
    const others = CATALOG.filter(entry => entry.id !== currentId())
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

async function setPrefs($: EngineInterface, change: (p: AsciimoodPrefs) => AsciimoodPrefs) {
  chosen = change(chosen)
  await update($, prefs, () => chosen)
  await $.store.set('prefs', chosen)
}

/** Puts `id` on screen the way the current mode keeps it. */
function choose($: EngineInterface, id: string) {
  return setPrefs($, p => {
    if (p.mode === 'one') return { ...p, one: id }
    if (p.mode === 'shuffle') {
      shuffled = id
      return p
    }
    return { ...p, perState: { ...p.perState, [now.state]: id } }
  })
}
function step($: EngineInterface, by: number) {
  void update($, view, w => ({ ...w, cat: '', offset: 0 }))
  const i = CATALOG.findIndex(entry => entry.id === currentId())
  return choose($, wrapAt(CATALOG, i + by).id)
}
function pickRandom($: EngineInterface) {
  void update($, view, w => ({ ...w, cat: '', offset: 0 }))
  const others = CATALOG.filter(entry => entry.id !== currentId())
  return choose($, wrapAt(others, Math.floor(Math.random() * others.length)).id)
}

const STATES = Object.keys(LABELS) as AgentState[]

/**
 * A setup as asciimood.com's configurator writes it: `all=<animation>` plays one for
 * everything, `<state>=<animation>` picks per state (states left out keep theirs).
 * Nothing changes unless every pair is understood.
 */
export async function applySetup($: EngineInterface, arg: string): Promise<string> {
  const picks: Partial<Record<AgentState | 'all', string>> = {}
  for (const pair of arg.split(/\s+/)) {
    const [key = '', id = ''] = pair.split('=')
    if (key !== 'all' && !STATES.includes(key as AgentState)) return `Unknown state "${key}": use all, ${STATES.join(', ')}.`
    if (!BY_ID.has(id)) return `No animation called "${id}". Try /asciimood list.`
    picks[key as AgentState | 'all'] = id
  }
  const { all, ...perState } = picks
  if (all !== undefined) {
    await setPrefs($, p => ({ ...p, mode: 'one', one: all }))
    return `Asciimood: ${BY_ID.get(all)?.name} for everything.`
  }
  await setPrefs($, p => ({ ...p, mode: 'auto', perState: { ...p.perState, ...perState } }))
  return `Asciimood: ${Object.entries(perState).map(([state, id]) => `${LABELS[state as AgentState]} → ${BY_ID.get(id)?.name}`).join(', ')}.`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = (await $.store.get('prefs')) as Partial<AsciimoodPrefs> | undefined
    chosen = { ...INITIAL_PREFS, ...(await read($, prefs)), ...(saved ?? {}) }
    await update($, prefs, () => chosen)
    now = await read($, agent)
    await $.command.register({
      name: 'asciimood',
      description: 'Pick the Asciimood animations (or: random, next, prev, shuffle, pause, tools, list, site, close, demo, tour [category] [seconds], stop, <animation>, <state>=<animation>)',
      argumentHint: '[demo|tour [category] [seconds]|stop|random|next|prev|shuffle|pause|tools|list|site|close|<animation>|think=<animation> …]',
    })
    $.clock.every(Math.round(1000 / FPS), () => void tick($))
    $.ui.status(LABELS[now.state])

    return next(e)
  })

  on('command.run', { command: 'asciimood' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'site') return { text: `Asciimood's website: ${SITE_URL}` }
    if (arg === 'list') {
      return { text: CATALOG.map(entry => `${entry.id} — ${entry.name} (${entry.by})`).join('\n') }
    }
    if (arg.includes('=')) return { text: await applySetup($, arg) }
    if (arg === 'shuffle') {
      await setPrefs($, p => ({ ...p, mode: 'shuffle' }))
      return { text: 'Asciimood: a new animation at each change of state.' }
    }
    const [verb = '', ...rest] = arg.split(/\s+/)
    if (verb === 'stop') {
      stopReel()
      await setAgent($, 'idle')
      return { text: 'Asciimood: filming stopped.' }
    }
    if (verb === 'demo') {
      stopReel()
      playDemo($)
    }
    else if (verb === 'tour') {
      const seconds = Number(rest.find(word => /^\d+(\.\d+)?$/.test(word)) ?? 4)
      const shelf = rest.find(word => CATEGORIES.includes(word))
      const list = shelf === undefined ? CATALOG : CATALOG.filter(entry => entry.cat === shelf)
      stopReel()
      playTour($, list, Math.max(1, seconds) * 1000)
    }
    else if (arg === 'random') await pickRandom($)
    else if (arg === 'next') await step($, 1)
    else if (arg === 'prev') await step($, -1)
    else if (arg === 'pause') await setPrefs($, p => ({ ...p, isPaused: !p.isPaused }))
    else if (arg === 'tools') await setPrefs($, p => ({ ...p, isHidingTools: !p.isHidingTools }))
    else if (arg === 'close') {
      await update($, view, w => ({ ...w, isOpen: false }))
      await $.ui.close({ id: PANE })
      return { text: 'Asciimood closed.' }
    }
    else if (arg !== '') {
      const entry = CATALOG.find(one => one.id === arg || one.name.toLowerCase() === arg)
      if (entry === undefined) return { text: `No animation called "${arg}". Try /asciimood list.` }
      await choose($, entry.id)
    }
    if (e.presentation?.isFullscreen !== true) {
      await update($, view, w => ({ ...w, isOpen: true }))
      return { text: 'Asciimood is open above the prompt: ctrl+x then tab to use its keys, x to close.' }
    }
    const opened = await $.ui.open({
      id: PANE,
      title: 'Asciimood',
      rows: PANE_ROWS,
      columns: Math.max(80, (e.presentation?.columns ?? 120) - 40),
      focus: true,
      closeOnEscape: true,
    })

    return { text: opened.isPlaced ? `Asciimood: ${current().name}.` : 'Asciimood is waiting for a wider terminal.' }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      stopReel()
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

  // While a turn runs: the animation in place of the working line.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const p = await read($, prefs)
    const { state, detail } = await read($, agent)
    if (e.surface !== 'terminal') return next(e)
    const { Box, Text, Raster } = $.ui.resolve(e)
    const columns = e.viewport?.columns ?? 80
    const rows = e.viewport?.rows ?? 24
    const W = Math.max(20, Math.min(512, columns - 4))
    const H = Math.max(8, Math.min(26, Math.floor(rows * 0.5)))
    const site = siteFor(e.requestId, W, H)
    const entry = current()

    return (
      <Box flexDirection="column">
        {framed(
          $.ui.resolve(e),
          <Raster key="art" columns={W} rows={H} cells={toCells(site.shown ?? frameFor(site), W, H)} />,
          W,
          state,
        )}
        <Box>
          <Text color={STATE_COLORS[state]}>● </Text>
          <Text bold>{LABELS[state]}</Text>
          <Text dimColor>{detail === '' ? '' : `  ${detail}`}</Text>
          <Text dimColor>{`  ·  ${elapsed(Date.now() - turnStartedAt)}  ·  ${entry.name}${p.isPaused ? ' (paused)' : ''}  ·  /asciimood to change`}</Text>
        </Box>
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

  // On the main screen the picker is the band above the prompt, which may take
  // the terminal's whole height; in the fullscreen layout it is a docked pane.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const v = await read($, view)
    if (v.isOpen !== true || e.props.hasSurvey || e.surface === 'mobile') return next(e)
    const els = $.ui.resolve(e)
    const raster =
      e.surface === 'terminal'
        ? (W: number, H: number) => {
            const { Raster } = $.ui.resolve(e)
            const site = siteFor(e.requestId, W, H)
            return <Raster key="art" columns={W} rows={H} cells={toCells(site.shown ?? frameFor(site), W, H)} />
          }
        : undefined
    return drawPicker($, els, raster, e.props.bodyColumns, e.props.maxRows - 1, 'ctrl+x tab: use the keys · esc: back to the prompt')
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface === 'mobile') {
      const { Text } = $.ui.resolve(e)
      return <Text>Asciimood plays in the terminal: /asciimood there to choose.</Text>
    }
    const els = $.ui.resolve(e)
    const raster =
      e.surface === 'terminal'
        ? (W: number, H: number) => {
            const { Raster } = $.ui.resolve(e)
            const site = siteFor(PANE, W, H)
            return <Raster key="art" columns={W} rows={H} cells={toCells(site.shown ?? frameFor(site), W, H)} />
          }
        : undefined
    return drawPicker($, els, raster, e.props.bodyColumns, e.props.scroll.bodyRows, 'esc: back to the prompt')
  })
}
