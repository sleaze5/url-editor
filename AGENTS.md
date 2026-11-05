# url-editor

A browser extension for Chrome and Firefox that parses the current tab's URL into its parts and query parameters, lets you edit any of them, and opens the result.

## Technology stack

- UI: Solid `2` (`solid-js` and `@solidjs/web`) with TypeScript `7` in `.tsx` files. Read `node_modules/solid-js/CHEATSHEET.md` before writing Solid code: 2.0 differs from 1.x and from React.
- Styling: Tailwind CSS `4` through `@tailwindcss/vite`, Lightning CSS for transforms and minification, Lucide icons through `@lucide/solid`.
- Build: Vite `8` on Rolldown, Oxc for JavaScript minification, `@solidjs/vite-plugin` for JSX.
- Tooling: Bun (runtime, package manager, script runner, and `bun fmt`, its built-in Oxfmt), Oxlint with type-aware rules and type checking through `oxlint-tsgolint`, and `tsc` from TypeScript 7 (the Go compiler, tsgo).

## Layout

- `src/popup`: the page, its entry `main.tsx`, and the root component `App.tsx`.
- `src/components`: one Solid component per file.
- `src/lib/url`: parsing, decoding, encoding, and editing URLs. No UI and no browser APIs.
- `src/lib/browser`: tabs, windows, and draft storage through the extension APIs.
- `src/styles`: `app.css` imports Tailwind, `theme.css` holds the tokens, `base.css` the element defaults.
- `src/build`: the manifest and the post-build minifier used by `vite.config.ts`.
- `src/assets`: icons copied into the build.

## Tasks

Run everything through `bun run <script>`. Bun is the only tool to install. `bunfig.toml` sets `run.bun`, so every script and the tools it starts run on Bun instead of Node.js.

- `dev`: the Vite dev server at `http://127.0.0.1:5173`, which renders the popup with a sample URL. Add `?url=<encoded URL>` to load another.
- `dev:chrome`, `dev:firefox`: rebuild the extension into `dist/` on every change.
- `build`: build both extensions into `dist/url-editor-chrome` and `dist/url-editor-firefox`.
- `format`, `format:check`: `bun fmt` with the `[fmt]` options in `bunfig.toml`, which also sorts Tailwind classes.
- `lint`, `lint:fix`: Oxlint with the rules in `.oxlintrc.json`. Warnings fail.
- `typecheck`: `tsc --noEmit`.
- `check`: `format:check`, `lint`, then `typecheck`. `fix`: `lint:fix`, `format`, then `typecheck`.
- `ci`: `check`, then `build`. CI and the release workflow run it.

## Rules

- Read [DESIGN.md](./DESIGN.md) before you change UI, styles, icons, interface text, or motion.
- Style with Tailwind utilities in the components. Write each class name in full, never built from parts, so that Tailwind and the formatter can see it. Use only the tokens in `src/styles/theme.css`.
- Pass values to components, not accessors, and read props as `props.x`. Never destructure props.
- Write signals from event handlers, `onSettled`, or effect callbacks, never from a component body or a memo. Reads lag writes until the next microtask, so compute the next value in a local variable instead of reading a signal back after setting it.
- Import modules directly with their extension. Do not create barrel files.
- Keep `src/lib` free of Solid and of DOM rendering.
