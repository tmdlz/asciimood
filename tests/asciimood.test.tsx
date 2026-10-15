import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

/** What the engine answers beneath the plugin in a session: preferences and the clock. */
const host = (on: On) => {
  mock.store(on)
  mock.clock(on)
}

const PANE_PROPS = {
  title: 'Asciimood',
  isFocused: true,
  bodyColumns: 80,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}
const ROW = {
  tool_use_id: 'toolu_1',
  tool: 'Bash',
  input: { command: 'npm test' },
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
}

test('the picker draws the animation and changes it on a press', async ($, on) => {
  host(on)
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'Pane', requestId: 'asciimood', props: PANE_PROPS })
  expect(await ui.find({ type: 'Raster', key: 'art' })).toBeDefined()
  expect(await ui.find({ type: 'Link' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeDefined()

  const playing = async () => (await ui.find({ type: 'Text', text: /^› / }))?.text
  const before = await playing()
  await ui.press({ key: 'next' })
  expect(await playing()).not.toBe(before)

  await ui.press({ key: 'mode-one' })
  await ui.press({ key: 'cat-scenes' })
  await ui.press({ key: 'down' })
  await ui.press({ key: 'anim-tokyo-rain' })
  expect(await playing()).toBe('› Tokyo rain')
  expect(await ui.find({ type: 'Text', text: /neon signs/ })).toBeDefined()
})

test('a tool call folds into one quiet line', async $ => {
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'ToolUse', requestId: 'toolu_1', props: ROW })
  expect((await ui.find({ type: 'Text', text: /Bash npm test/ }))).toBeDefined()
})

test('a failed call shows in full', async ($, on) => {
  on('ui.render', { component: 'ToolUse' }, async $ => {
    const { Text } = $.ui.resolve({ surface: 'terminal', component: 'ToolUse' })
    return <Text>engine row</Text>
  })
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'ToolUse', requestId: 'toolu_2', props: { ...ROW, isErrored: true } })
  expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeDefined()
})

test('the animation follows what the agent does', async ($, on) => {
  host(on)
  on('tool.call', async (_, e) =>
    e.tool === 'Bash' ? { result: 'boom', text: 'boom', isError: true } : { result: 'ok', text: 'ok' })
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'Pane', requestId: 'asciimood', props: PANE_PROPS })
  await $.tool.call({ tool: 'Edit', tool_use_id: 'toolu_3', input: { file_path: '/x/theme.css', old_string: 'a', new_string: 'b' } })
  expect(await ui.find({ type: 'Text', text: 'writing code' })).toBeDefined()

  await $.tool.call({ tool: 'Bash', tool_use_id: 'toolu_4', input: { command: 'npm test' } })
  expect(await ui.find({ type: 'Text', text: 'hit an error' })).toBeDefined()
})

test('while a turn runs, the animation takes the working line', async ($, on) => {
  host(on)
  const ui = await $.ui.mount({
    plugin: 'asciimood',
    surface: 'terminal',
    component: 'Spinner',
    requestId: 'main',
    props: { word: 'Doodling', message: null, suffix: '…', mode: 'tool-use' },
    viewport: { columns: 100, rows: 40 },
  })
  const art = await ui.find({ type: 'Raster', key: 'art' })
  expect(art?.props?.columns).toBe(96)
  expect(art?.props?.rows).toBe(20)
  expect(await ui.find({ type: 'Text', text: /\/asciimood to change/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' asciimood ' })).toBeDefined()
})

test('on the main screen the picker fills the band above the prompt', async ($, on) => {
  host(on)
  const said = await $.command.run({ command: 'asciimood', args: '' })
  expect(JSON.stringify(said)).toContain('above the prompt')
  const ui = await $.ui.mount({
    plugin: 'asciimood',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 50, bodyColumns: 120, scroll: { offset: 0, bodyRows: 49 }, view: {} },
  })
  const art = await ui.find({ type: 'Raster', key: 'art' })
  expect(art?.props?.rows).toBe(40)
  expect(await ui.find({ type: 'Button', key: 'close' })).toBeDefined()
})

test('a setup from the website picks per state, or one for everything', async ($, on) => {
  host(on)
  const per = await $.command.run({ command: 'asciimood', args: 'think=wire-cube write=fire' })
  expect(JSON.stringify(per)).toContain('thinking… → Cube, writing code → Fire')

  const all = await $.command.run({ command: 'asciimood', args: 'all=sleeping-cat' })
  expect(JSON.stringify(all)).toContain('Sleeping cat for everything')

  const bad = await $.command.run({ command: 'asciimood', args: 'think=wire-cube nap=fire' })
  expect(bad.text).toContain('Unknown state "nap"')
  const missing = await $.command.run({ command: 'asciimood', args: 'think=nope' })
  expect(missing.text).toContain('No animation called "nope"')
})

test('a demo plays a session with no model, and stop ends it', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  const ui = await $.ui.mount({ plugin: 'asciimood', surface: 'terminal', component: 'Pane', requestId: 'asciimood', props: PANE_PROPS })
  await $.command.run({ command: 'asciimood', args: 'demo' })
  expect(await ui.find({ type: 'Text', text: 'thinking…' })).toBeDefined()
  await clock.advance(3600)
  expect(await ui.find({ type: 'Text', text: 'reading files' })).toBeDefined()
  await clock.advance(3600)
  expect(await ui.find({ type: 'Text', text: 'writing code' })).toBeDefined()

  const stopped = await $.command.run({ command: 'asciimood', args: 'stop' })
  expect(stopped.text).toContain('filming stopped')
  await clock.advance(10_000)
  expect(await ui.find({ type: 'Text', text: 'waiting for you' })).toBeDefined()
})
