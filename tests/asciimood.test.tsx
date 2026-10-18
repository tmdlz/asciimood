import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import { BY_ID, render } from '../hooks/catalog.ts'

/** What the engine answers beneath the plugin in a session: preferences, the clock, and asciimood.com. */
const host = (on: On, setup: unknown = undefined) => {
  mock.store(on, { device: '0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43' })
  const clock = mock.clock(on)
  mock.env(on, {})
  const asked: string[] = []
  on('http.fetch', async (_, e) => {
    asked.push(e.url)
    return {
      value: setup === undefined
        ? { status: 404, ok: false, headers: {}, text: '{}' }
        : { status: 200, ok: true, headers: {}, text: JSON.stringify({ setup }) },
    }
  })
  const opened: string[][] = []
  on('process.run', async (_, e) => {
    opened.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  return { clock, asked, opened }
}

const ROW = {
  tool_use_id: 'toolu_1',
  tool: 'Bash',
  input: { command: 'npm test' },
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
}
const SPINNER = {
  plugin: 'asciimood',
  surface: 'terminal',
  component: 'Spinner',
  requestId: 'main',
  props: { word: 'Doodling', message: null, suffix: '…', mode: 'tool-use' },
  viewport: { columns: 100, rows: 40 },
} as const

test('while a turn runs, the animation fills the window above the prompt', async ($, on) => {
  host(on)
  const ui = await $.ui.mount(SPINNER)
  const art = await ui.find({ type: 'Raster', key: 'art' })
  expect(art?.props?.columns).toBe(96)
  expect(art?.props?.rows).toBe(30)
  expect(await ui.find({ type: 'Text', text: /\/asciimood to change/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' asciimood ' })).toBeDefined()
})

test('the animation follows what the agent does', async ($, on) => {
  host(on)
  on('tool.call', async (_, e) =>
    e.tool === 'Bash' ? { result: 'boom', text: 'boom', isError: true } : { result: 'ok', text: 'ok' })
  const ui = await $.ui.mount(SPINNER)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'toolu_3', input: { file_path: '/x/theme.css', old_string: 'a', new_string: 'b' } })
  expect(await ui.find({ type: 'Text', text: 'writing code' })).toBeDefined()

  await $.tool.call({ tool: 'Bash', tool_use_id: 'toolu_4', input: { command: 'npm test' } })
  expect(await ui.find({ type: 'Text', text: 'hit an error' })).toBeDefined()
})

test('/asciimood opens this device\'s page on asciimood.com and picks up what is saved there', async ($, on) => {
  const { clock, asked, opened } = host(on, { mode: 'one', one: 'fire', perState: {}, isHidingTools: true })
  const said = await $.command.run({ command: 'asciimood', args: '' })
  expect(said.text).toContain('https://asciimood.com/setup/#d=0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43')
  expect(opened[0]).toEqual(['open', 'https://asciimood.com/setup/#d=0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43'])

  await clock.advance(3_500)
  expect(asked).toContain('https://asciimood.com/api/setup/0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43')
  const ui = await $.ui.mount(SPINNER)
  expect(await ui.find({ type: 'Text', text: /Fire/ })).toBeDefined()
})

test('a setup from the website is checked: unknown animations keep their defaults', async ($, on) => {
  const { clock } = host(on, { mode: 'auto', perState: { think: 'not-a-thing', write: 'fire' }, isHidingTools: false })
  on('ui.render', { component: 'ToolUse' }, async $ => {
    const { Text } = $.ui.resolve({ surface: 'terminal', component: 'ToolUse' })
    return <Text>engine row</Text>
  })
  await $.command.run({ command: 'asciimood', args: '' })
  await clock.advance(3_500)
  // isHidingTools false: the engine draws the row in full.
  const row = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'ToolUse', requestId: 'toolu_9', props: ROW })
  expect(await row.find({ type: 'Text', text: 'engine row' })).toBeDefined()
})

test('the old setup lines are gone: the website is the only place to choose', async ($, on) => {
  host(on)
  const said = await $.command.run({ command: 'asciimood', args: 'think=fire' })
  expect(said.text).toContain('set up on the website')
})

test('a tool call folds into one quiet line', async ($, on) => {
  host(on)
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'ToolUse', requestId: 'toolu_1', props: ROW })
  expect(await ui.find({ type: 'Text', text: /Bash npm test/ })).toBeDefined()
})

test('a failed call shows in full', async ($, on) => {
  host(on)
  on('ui.render', { component: 'ToolUse' }, async $ => {
    const { Text } = $.ui.resolve({ surface: 'terminal', component: 'ToolUse' })
    return <Text>engine row</Text>
  })
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'ToolUse', requestId: 'toolu_2', props: { ...ROW, isErrored: true } })
  expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
})

test('a demo plays a session with no model on the stage, and stop ends it', async ($, on) => {
  const { clock } = host(on)
  await $.command.run({ command: 'asciimood', args: 'demo' })
  const ui = await $.ui.mount({
    plugin: 'asciimood',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 50, bodyColumns: 120, scroll: { offset: 0, bodyRows: 49 }, view: {} },
  })
  expect(await ui.find({ type: 'Text', text: 'thinking…' })).toBeDefined()
  await clock.advance(3600)
  expect(await ui.find({ type: 'Text', text: 'reading files' })).toBeDefined()

  const stopped = await $.command.run({ command: 'asciimood', args: 'stop' })
  expect(stopped.text).toContain('filming stopped')
})

test('a clean tour shows the animation alone, filling the stage', async ($, on) => {
  host(on)
  await $.command.run({ command: 'asciimood', args: 'tour 3 clean' })
  const ui = await $.ui.mount({
    plugin: 'asciimood',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 50, bodyColumns: 120, scroll: { offset: 0, bodyRows: 49 }, view: {} },
  })
  const art = await ui.find({ type: 'Raster', key: 'art' })
  expect(art?.props?.columns).toBe(120)
  expect(art?.props?.rows).toBe(49)
  expect(await ui.find({ type: 'Text', text: ' asciimood ' })).toBeUndefined()
})

test('a Pro animation plays from frames asciimood.com sends a licensed device, and stops with the license', async ($, on) => {
  mock.store(on, { device: '0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43' })
  const clock = mock.clock(on)
  mock.env(on, {})
  on('process.run', async () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }))
  const DRAGON = { id: 'dragon', name: 'Dragon', note: 'a little dragon', dur: 6, hues: [6, 38] }
  let isLicensed = true
  const asked: string[] = []
  on('http.fetch', async (_, e) => {
    asked.push(e.url)
    if (e.url.includes('/api/pro/frames/')) {
      const frame = Array.from({ length: 28 }, () => 'D'.repeat(96)).join('\n')
      return { value: { status: 200, ok: true, headers: {}, text: [frame, frame].join('\f') } }
    }
    const body = { setup: { mode: 'one', one: 'dragon', perState: {}, isHidingTools: true }, ...(isLicensed ? { pro: { catalog: [DRAGON] } } : {}) }
    return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
  })
  await $.command.run({ command: 'asciimood', args: '' })
  await clock.advance(3_500)
  const ui = await $.ui.mount(SPINNER)
  expect(await ui.find({ type: 'Text', text: /Dragon/ })).toBeDefined()
  await clock.advance(200)
  // a 100x40 window plays the 96x28 render, fetched for this device
  expect(asked).toContain('https://asciimood.com/api/pro/frames/dragon/96x28?d=0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43')

  isLicensed = false
  await clock.advance(3_500)
  expect(await ui.find({ type: 'Text', text: /Sleeping cat/ })).toBeDefined()
})

test('/asciimood with the Pro key from the email turns Pro on for this device', async ($, on) => {
  mock.store(on, { device: '0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43' })
  mock.clock(on)
  mock.env(on, {})
  on('process.run', async () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }))
  const sent: { url: string; body?: string }[] = []
  on('http.fetch', async (_, e) => {
    sent.push({ url: e.url, body: e.init?.body })
    if (e.url.endsWith('/api/pro/activate')) {
      const ok = String(e.init?.body).includes('ASCIIMOOD-GOOD')
      return { value: { status: ok ? 200 : 400, ok, headers: {}, text: JSON.stringify(ok ? { ok: true, pro: true } : { error: 'not activated', reason: 'unknown' }) } }
    }
    return { value: { status: 404, ok: false, headers: {}, text: '{}' } }
  })
  const on1 = await $.command.run({ command: 'asciimood', args: 'ASCIIMOOD-GOOD-1234-ABCD' })
  expect(on1.text).toContain('Pro is on')
  expect(sent.find(s => s.url.endsWith('/api/pro/activate'))?.body).toBe(JSON.stringify({ device: '0b7c1a52-4d3e-4f7a-9c11-2a6b8e0d5f43', key: 'ASCIIMOOD-GOOD-1234-ABCD' }))
  const bad = await $.command.run({ command: 'asciimood', args: 'activate ASCIIMOOD-NOPE-0000-0000' })
  expect(bad.text).toContain('not known')
})

test('animations sit on the terminal\'s own ground; a white ink takes the terminal\'s text colour', async () => {
  const bolt = render(BY_ID.get('bolt')!, 0, 40, 12) // white ink, drawn on a black ground on the website
  expect(bolt.bg).toBeUndefined()
  expect(bolt.fg[0]).toBe(0x01000000)
  const radiation = render(BY_ID.get('radiation')!, 0, 40, 12) // yellow ink keeps its colour
  expect(radiation.bg).toBeUndefined()
  expect(radiation.fg[0]).toBe(0xf2c21b)
})

test('play pins one animation for a while, to film a prompt with it', async ($, on) => {
  const { clock } = host(on)
  // Claude Code's own band, back once the stage closes
  on('ui.render', { component: 'AbovePrompt' }, async $ => {
    const { Text } = $.ui.resolve({ surface: 'terminal', component: 'AbovePrompt' })
    return <Text>engine band</Text>
  })
  const asked = await $.command.run({ command: 'asciimood', args: 'play' })
  expect(asked.text).toContain('which one?')
  const played = await $.command.run({ command: 'asciimood', args: 'play cup of tea 20' })
  expect(played.text).toContain('Cup of tea')
  const stage = () => $.ui.mount({
    plugin: 'asciimood',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 50, bodyColumns: 120, scroll: { offset: 0, bodyRows: 49 }, view: {} },
  })
  expect(await (await stage()).find({ type: 'Text', text: /Cup of tea/ })).toBeDefined()
  await clock.advance(19_000)
  expect(await (await stage()).find({ type: 'Text', text: /Cup of tea/ })).toBeDefined()
  await clock.advance(2_000)
  const after = await stage()
  expect(await after.find({ type: 'Text', text: 'engine band' })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /Cup of tea/ })).toBeUndefined()
})
