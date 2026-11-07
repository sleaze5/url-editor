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
- `test`: `bun test`, which runs every `*.test.ts`: the URL library tests in `src/lib/url` and the dependency updater tests in `scripts/deps`.
- `deps:update`: update every package and the Bun version in `devEngines` with `scripts/deps/update.ts`, then `bun install`.
- `check`: `format:check`, `lint`, `typecheck`, then `test`. `fix`: `lint:fix`, `format`, then `typecheck`.
- `ci`: `check`, then `build`. CI and the release workflow run it.

## Rules

- Never modify `README`.
- Read [DESIGN.md](./DESIGN.md) before you change UI, styles, icons, interface text, or motion.
- Style with Tailwind utilities in the components. Write each class name in full, never built from parts, so that Tailwind and the formatter can see it. Use only the tokens in `src/styles/theme.css`.
- Pass values to components, not accessors, and read props as `props.x`. Never destructure props.
- Write signals from event handlers, `onSettled`, or effect callbacks, never from a component body or a memo. Reads lag writes until the next microtask, so compute the next value in a local variable instead of reading a signal back after setting it.
- Import modules directly with their extension. Do not create barrel files.
- Keep `src/lib` free of Solid and of DOM rendering.
- Put tests next to the module they test, as `<module>.test.ts`, and test through the module's exports.
- Name everything for exactly what it holds or does, so the code reads without its implementation. Prefer long and accurate to short and vague: `typedText`, not `raw`; `textarea`, not `el`. This covers every name: functions, variables, parameters, constants, globals, locals, exports, types and their fields, and props.
    - Name booleans as questions: `isWindowed`, `wasBlocked`.
    - Name side effects too: `prepareWindowAndDecideToRender`, not `prepareWindow`.
    - No single letters, abbreviations, or generic words such as `data`, `value`, or `temp`, except names a specification defines and `_` for an unused parameter.
    - When a name stops fitting, rename it everywhere in the same change.

## CI and releases

The workflows in `.github/workflows` are built from reusable workflows and composite actions in `.github/actions`, and run only what a change needs.

- `ci.yml` runs on every push to a branch other than the default branch, on fork pull requests, and by hand. Pull requests from this repository skip it, because the push to their branch already ran it on the same commit. A newer push cancels the older run.
    - `changes` runs the `changes` action. It compares the branch with its merge base on the default branch and selects the jobs whose inputs changed: `build` for `src/` and `vite.config.ts`, `code` (lint and typecheck) for `src/`, `scripts/`, and `.oxlintrc.json`, and `test` for `src/` and `scripts/`. `tsconfig.json`, the packages, `bunfig.toml`, the workflows, the actions, any other unknown path, an empty diff, and a run by hand with `scope: all` select everything. Markdown and other prose select nothing.
    - `check` calls `check.yml`. It always runs the format check, lints and typechecks when `code` is selected, and runs the tests when `test` is selected. The four checks share one job, because together they take about a second and each job costs several seconds of setup.
    - `build` calls `build.yml` when `build` is selected, in parallel with `check`. It uploads the zipped Chrome and Firefox extensions, so every change can be installed and tried.
    - `ci` passes only when every selected job passed and every other job was skipped. Require this check on the default branch.
- `build.yml` caches `dist/` under a hash of every file the build reads. On a hit it skips Bun, the install, and the build, and only packages and uploads. Keep its key in step with the `build` paths in the `changes` action.
- The `setup-bun` action installs the Bun version in `devEngines` in `package.json` and runs `bun install --frozen-lockfile`, restoring the Bun install cache. Only `cache.yml` saves that cache, so branch runs never spend time uploading it.
- `cache.yml` warms the install and build caches on the default branch on every push to it, every week, and after a landed commit. A run can only restore the caches of its own branch and of the default branch.
- `release.yml` runs by hand on the default branch and is never cancelled. It fails when the tag for the version in `package.json` exists, runs `check.yml` and `build.yml` in parallel, and publishes the zipped extensions from the build artifact as a GitHub release with the commits since the last tag.
- `deps.yml` runs `scripts/deps/update.ts` every Monday. It moves every package and the Bun version in `devEngines` to its newest stable release, major versions included, and a prerelease along its own line (`2.0.0-rc.21` to `2.0.0-rc.22`) until a stable release of it exists. It skips releases newer than 7 days. It lands the commit with the `land` action: push to `deps/update`, run CI there, then push the same commit to the default branch and warm the caches. A commit that fails CI never lands.
- Dependabot updates the GitHub Actions every week, major versions included, after a 7-day cooldown. `dependabot.yml` merges its pull request once CI passes on the exact commit it tested.
