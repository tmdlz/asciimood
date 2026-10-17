# Asciimood

Tired of watching code scroll by? Asciimood swaps the wall of tool calls in Claude Code for a looping ASCII animation that reacts to what the agent is doing: thinking, reading, writing, running a command, hitting an error, done. Errors and permission prompts always stay visible.

Free. Every animation is drawn by Asciimood. → [asciimood.com](https://asciimood.com)

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install asciimood --marketplace tmdlz/asciimood
```

Answer `y` to add the marketplace, press Enter to pick the user scope, and it's active.

From a shell:

```
claude plugin install asciimood --marketplace tmdlz/asciimood
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `tmdlz/asciimood`, then Add plugin.

## Choose your animations

Type `/asciimood`. Your setup page opens on asciimood.com, linked to this Claude Code: pick an animation for each state (or one for everything, or shuffle). It plays here within seconds. No account: the link is an anonymous id the plugin makes for itself, and the page stores only your picks.

Bought Asciimood Pro? Type `/asciimood` followed by the key from your purchase email (`/asciimood ASCIIMOOD-…`): Pro turns on for this Claude Code, then pick your Pro animations with `/asciimood`.

## Updating

```
claude plugin marketplace update asciimood
claude plugin update asciimood@asciimood
```

Then restart Claude Code.

## Filming a demo

These run in the plugin alone: no model call, no tokens.

- `/asciimood demo`: plays a made-up session (thinking, reading, writing, running, an error, done) with your setup.
- `/asciimood tour`: walks the whole library, 4 seconds each. `/asciimood tour 6` gives each 6 seconds. Add `clean` (`/asciimood tour 3 clean`) to hide the frame and status line, so the animation fills the window.
- `/asciimood stop`: ends it. Sending a real message ends it too.
