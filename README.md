# Asciimood

Tired of watching code scroll by? Asciimood swaps the wall of tool calls in Claude Code for a looping ASCII animation that reacts to what the agent is doing: thinking, reading, writing, running a command, hitting an error, done. Errors and permission prompts always stay visible.

Free. 139 animations included. → [asciimood.com](https://asciimood.com)

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install asciimood --marketplace tmdlz/asciimood
```

Answer `y` to add the marketplace, press Enter to pick the user scope, and it's active. Then type `/asciimood` to pick your animation.

From a shell:

```
claude plugin install asciimood --marketplace tmdlz/asciimood
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `tmdlz/asciimood`, then Add plugin.

## Credits

126 of the animations come from [ascii.rest](https://ascii.rest) by bas3line, under the MIT license: see `hooks/pieces/LICENSE-ascii-rest`. Thank you!
