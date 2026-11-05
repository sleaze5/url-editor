# Design

URL Editor is a browser-toolbar popup for taking a URL apart, changing it, and opening the result. It is an operate surface: people arrive with a task and leave seconds later. The design gets out of the way and stays precise.

## Principles

- **Fast and quiet.** The popup sits next to browser chrome, so it follows the browser's light or dark theme and uses the system UI font. Nothing animates on open.
- **Data in monospace, interface in sans.** URL text is shown in a monospace stack because characters such as `%20`, `l`/`1`, and `0`/`O` must stay readable. Labels, buttons, and messages use `system-ui`.
- **One primary action.** "Open URL" is the only filled button. Everything else is neutral, ghost, or dashed (for "add" affordances).
- **Labels are sentence case.** No all-caps or tracked-out labels, no arrows appended to button text.
- **Errors explain the fix.** A rejected edit shows a callout under the field with the rule and how to undo it (`Esc`). The footer reports navigation failures and the edited state.

## Tokens

All colours live in `src/styles/global.css` as custom properties, with a light set on `:root` and a dark set under `prefers-color-scheme: dark`. Components use only these tokens.

| Token | Role |
| --- | --- |
| `--bg`, `--surface`, `--surface-hover`, `--surface-raised` | Page, inputs, hover, and floating layers (tooltips, callouts) |
| `--border`, `--border-hover` | Control outlines and dividers |
| `--text`, `--muted`, `--placeholder` | Body, labels, and placeholders; each meets 4.5:1 on its surface |
| `--focus`, `--focus-ring`, `--selection` | The single accent: focus, caret, selection, and the "Edited" dot |
| `--danger`, `--danger-ring` | Invalid input and failure messages |
| `--primary`, `--primary-hover`, `--primary-text` | The primary button |

Sizing: base type 12px, labels 11px/500, controls 26px tall, buttons 28px, minimum pointer target 24px. Spacing steps are 4, 6, 8, 10, and 12px. Radius is 4px.

## Motion

- Durations stay at or under 150ms; `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) for responses and `ease` for colour.
- Buttons scale to 0.97 on press. Swapped icons (copy → check) and error callouts enter with `@starting-style`.
- Tooltips wait 400ms the first time, then open instantly while moving between neighbours.
- Keyboard actions, such as reordering with the arrow keys, never animate.
- `prefers-reduced-motion` turns off scale and movement and keeps colour and opacity changes.

## Accessibility

- Every control has a visible `:focus-visible` ring in `--focus`.
- Icon buttons carry `aria-label`; tooltips are `aria-hidden` duplicates.
- Status changes (edited, copy result, failures, field errors) are announced through polite live regions.
- Parameter reordering works by drag or by the arrow keys on the grip.
