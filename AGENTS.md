# url-editor

URL Editor is a Chrome and Firefox extension. It lets users edit the current tab's URL, its parts, and query parameters, then open the result.

The interface has editor and history views, a draft stash, and an optional tab-change watcher. Users can load history entries into the editor. If the editor has unsaved edits, users must choose Stash, Discard, or Cancel first.

## Stack

- UI: Solid 2 and TypeScript 7.
- Styles and icons: Tailwind CSS 4, Lightning CSS, and Lucide (`@lucide/solid`).
- Build: Vite 8, Rolldown, Oxc minification, and `@solidjs/vite-plugin`.
- Tools: Bun for the runtime, packages, scripts, formatting, and tests. Oxlint for linting. TypeScript's Go compiler for typechecking.

## Development

Use Bun for all development tasks. Run `bun run --list` to list the available commands. Run `bun run <script>` to execute a command.

- Never edit README files.
- Before you write Solid code, read `node_modules/solid-js/CHEATSHEET.md`.
- Follow existing UI patterns. Use the theme tokens and shared styles in `src/styles/`.
- Pass values to components, not accessors. Read props as `props.x`. Do not destructure props.
- Write signals only in event handlers, `onSettled`, or effect callbacks. Signal reads reflect writes after the next microtask.
- Import modules directly with their extensions.
- Keep `src/lib` free of Solid and DOM rendering.
- Components import from `src/lib` and other components, never from `src/popup`.
- Access session storage through `src/lib/browser/session-storage.ts`. Check stored values and messages with type guards before you use them.
- Use descriptive names. Name booleans as questions, such as `isWindowed`. Name collections in the plural, such as `stashedDrafts`. Put qualifiers such as `Count` and `Ms` at the end, such as `MAX_HISTORY_ENTRY_COUNT`.
- Do not write code comments. Let names and types explain the code. Exceptions: version comments on pinned actions in `.github/`, and a comment that explains an empty `catch` block.
- Put tests beside their modules. Use the filename `<module>.test.ts`.

## CI and releases

- CI runs on pushes to branches other than `main`, fork pull requests, and manual requests. It always checks formatting. Changed files determine which lint, typecheck, test, and build jobs run. The `ci` job requires every selected job to pass.
- Builds produce Chrome and Firefox extension ZIPs. Builds reuse cached output when available. The cache workflow runs on `main` pushes, weekly, and after automated dependency updates reach the default branch.
- Start releases manually from the default branch. The version tag from `package.json` must not exist. The release workflow runs all checks and builds. It then publishes the extension ZIPs and commit notes to GitHub Releases.
- Weekly dependency updates include packages and Bun. Updates normally exclude releases less than seven days old. Updates reach the default branch only after CI passes.
- Dependabot updates GitHub Actions. Automatic merges require CI to pass on the exact commit being merged.
