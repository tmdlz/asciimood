# Asciimood

Tired of watching code scroll by? Asciimood swaps the wall of tool calls in Claude Code for a looping ASCII animation that reacts to what the agent is doing: thinking, reading, writing, running a command, hitting an error, done. Errors and permission prompts always stay visible.

Free. 139 animations included. → [asciimood.com](https://asciimood.com)

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install asciimood --marketplace tmdlz/asciimood
```

Answer `y` to add the marketplace, press Enter to pick the user scope, and it's active. Then type `/asciimood` to pick your animation, or build a setup at [asciimood.com/#config](https://asciimood.com/#config) and paste the line it gives you.

From a shell:

```
claude plugin install asciimood --marketplace tmdlz/asciimood
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `tmdlz/asciimood`, then Add plugin.

## Updating

```
claude plugin marketplace update asciimood
claude plugin update asciimood@asciimood
```

Then restart Claude Code.

## Filming a demo

These run in the plugin alone: no model call, no tokens.

- `/asciimood demo`: plays a made-up session (thinking, reading, writing, running, an error, done) with your setup.
- `/asciimood tour`: walks the whole library, 4 seconds each. `/asciimood tour scenes 6` keeps to one shelf, 6 seconds each.
- `/asciimood stop`: ends it. Sending a real message ends it too.

## Credits

126 of the animations come from [ascii.rest](https://ascii.rest) by bas3line, under the MIT license: see `hooks/pieces/LICENSE-ascii-rest`. Thank you!
