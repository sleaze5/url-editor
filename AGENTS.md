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
- `scripts/deps`: the dependency updater that `deps.yml` runs, with its tests.
- `.github`: the CI, cache, release, and dependency workflows. See [CI and releases](#ci-and-releases).

## Tasks

Run everything through `bun run <script>`. Bun is the only tool to install. `bunfig.toml` sets `run.bun`, so every script and the tools it starts run on Bun instead of Node.js.

- `dev`: the Vite dev server at `http://127.0.0.1:5173`, which renders the popup with a sample URL. Add `?url=<encoded URL>` to load another.
- `dev:chrome`, `dev:firefox`: rebuild the extension into `dist/` on every change.
- `build`: build both extensions into `dist/url-editor-chrome` and `dist/url-editor-firefox`.
- `format`, `format:check`: `bun fmt` with the `[fmt]` options in `bunfig.toml`, which also sorts Tailwind classes.
- `lint`, `lint:fix`: Oxlint with the rules in `.oxlintrc.json`. Warnings fail.
- `typecheck`: `tsc --noEmit`.
- `test`: `bun test scripts`.
- `deps:update`: update every package and the Bun version in `devEngines` with `scripts/deps/update.ts`, then `bun install`.
- `check`: `format:check`, `lint`, `typecheck`, then `test`. `fix`: `lint:fix`, `format`, then `typecheck`.
- `ci`: `check`, then `build`. CI and the release workflow run it.

## Rules

- Read [DESIGN.md](./DESIGN.md) before you change UI, styles, icons, interface text, or motion.
- Style with Tailwind utilities in the components. Write each class name in full, never built from parts, so that Tailwind and the formatter can see it. Use only the tokens in `src/styles/theme.css`.
- Pass values to components, not accessors, and read props as `props.x`. Never destructure props.
- Write signals from event handlers, `onSettled`, or effect callbacks, never from a component body or a memo. Reads lag writes until the next microtask, so compute the next value in a local variable instead of reading a signal back after setting it.
- Import modules directly with their extension. Do not create barrel files.
- Keep `src/lib` free of Solid and of DOM rendering.

## CI and releases

The workflows in `.github/workflows` are built from reusable workflows and composite actions in `.github/actions`, and are meant to run only what a change needs.

- `ci.yml` runs on every push to a branch other than the default branch, on fork pull requests, and by hand. Pull requests from this repository skip it, because the push to their branch already ran it on the same commit.
    - `changes` runs the `changes` action. It compares the branch with its merge base on the default branch and selects `app` for `src/`, the build and lint configuration, and the packages, and `scripts` for `scripts/` and the packages. Markdown and other prose select nothing. Any other path, such as a workflow, an empty diff, and a run by hand with `scope: all` select everything.
    - `check` calls `check.yml`. It always runs the format check, lints and typechecks when `app` or `scripts` changed, and runs the tests when `scripts` changed.
    - `build` calls `build.yml` when `app` changed. It uploads the zipped Chrome and Firefox extensions as an artifact of the run, so every change can be installed and tried.
    - `ci` passes only when every selected job passed and every other job was skipped. Require this check on the default branch.
- `build.yml` caches `dist/` under a hash of every file the build reads. On a hit it skips Bun, the install, and the build, and only packages and uploads. Add a file to the key when the build starts to read it.
- The `setup-bun` action installs the Bun version in `devEngines` in `package.json`, with the Bun install cache, and runs `bun install --frozen-lockfile`.
- `cache.yml` warms the install and build caches on the default branch on every push to it, every week, and after a landed commit. A run can only restore the caches of its own branch and of the default branch.
- `release.yml` runs by hand on the default branch. It fails when the tag for the version in `package.json` exists, runs `check.yml` and `build.yml` in parallel, and publishes the zipped extensions from the build artifact as a GitHub release with the commits since the last tag.
- Dependabot updates the packages and the actions every week, without major versions, after a 7-day cooldown, and `dependabot.yml` merges its pull requests once `ci` passes. It ignores the prerelease Solid packages. `deps.yml` updates those and the Bun version in `devEngines` every Monday with `scripts/deps/update.ts --uncovered`, which moves a prerelease along its own line (`2.0.0-rc.21` to `2.0.0-rc.22`, or to `2.0.0`) and a stable version within its major version. Run it by hand for every package. It lands the commit with the `land` action: push to `deps/update`, run CI there, then push the same commit to the default branch and warm the caches.
