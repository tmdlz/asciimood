export type AgentState = 'idle' | 'think' | 'read' | 'write' | 'run' | 'error' | 'done'

/** What Claude is doing now, as the pane shows it. */
export type AsciimoodAgent = { state: AgentState; detail: string }

/**
 * Which animation plays: `auto` picks one per state (`perState`), `one` plays
 * `one` whatever the state, `shuffle` draws a new one at each change of state.
 * While a turn runs the animation takes the place of the working line.
 */
export type AsciimoodPrefs = {
  mode: 'auto' | 'one' | 'shuffle'
  one: string
  perState: Record<string, string>
  isPaused: boolean
  /** Fold each tool call into one quiet line while Asciimood plays. */
  isHidingTools: boolean
}

/** Where the picker's browsing stands: the shelf shown, how far down its list, and whether the band above the prompt shows it. */
export type AsciimoodView = { cat: string; offset: number; isOpen?: boolean }

declare module 'claude-code' {
  interface PluginState {
    asciimood: { agent: AsciimoodAgent; prefs: AsciimoodPrefs; view: AsciimoodView }
  }
}
