export type AgentState = 'idle' | 'think' | 'read' | 'write' | 'run' | 'error' | 'done'

/** What Claude is doing now, as the animation shows it. */
export type AsciimoodAgent = { state: AgentState; detail: string }

/**
 * Which animation plays, as chosen on asciimood.com: `auto` picks one per state
 * (`perState`), `one` plays `one` whatever the state, `shuffle` draws a new one
 * at each change of state. While a turn runs the animation takes the place of
 * the working line.
 */
export type AsciimoodPrefs = {
  mode: 'auto' | 'one' | 'shuffle'
  one: string
  perState: Record<string, string>
  /** Fold each tool call into one quiet line while Asciimood plays. */
  isHidingTools: boolean
}

/** Whether the stage (the animation alone, for filming) shows above the prompt. */
export type AsciimoodView = { isOpen?: boolean }

declare module 'claude-code' {
  interface PluginState {
    asciimood: { agent: AsciimoodAgent; prefs: AsciimoodPrefs; view: AsciimoodView }
  }
}
