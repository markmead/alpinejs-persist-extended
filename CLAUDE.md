# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```shell
pnpm install    # esbuild is the only dependency
pnpm build      # bundles + minifies builds/*.js into dist/
```

pnpm is pinned via `packageManager` in `package.json`. `pnpm-workspace.yaml` sets
`minimumReleaseAge` (48h supply-chain cooldown) and allowlists esbuild's
postinstall, which pnpm blocks by default.

There is no test suite, linter, or dev server. Verification is manual: create an
`index.html` at the repo root (gitignored for this purpose), serve the repo, and
load `dist/cdn.min.js` plus `alpinejs` and `@alpinejs/persist` from a CDN. Two
things to know when asserting:

- Alpine flushes reactive effects on the next tick, so check storage and the DOM
  after `await Alpine.nextTick()`, not synchronously after a write.
- `$persistExpire` restore paths only run at component init, so testing them
  means seeding `localStorage` and reloading the page.

`dist/` is committed to git, not just published. Run `pnpm build` and commit the
output alongside any change to `src/` or `builds/`, or the CDN build drifts from
source. `files` limits the npm tarball to `dist/`.

## What this plugin is for

It extends the official `@alpinejs/persist` plugin, which is declarative only:
the only way to touch a persisted key is to declare a reactive property bound to
it. This plugin adds expiry (`$persistExpire`) and imperative access to keys the
current component doesn't own (`$persistGet`, `$persistSet`, `$persistDelete`,
`$persistClear`). Anything that can be done by assigning to a `$persist`
property should be done that way instead — that path updates the UI and storage
together, and these helpers cannot.

Alpine is never a dependency. The plugin uses the `Alpine` instance handed to it,
and the CDN build uses the global. Keep it that way.

## Conventions

Modern JavaScript only — ESM `import`, `??`, `??=`, `?.`, optional catch binding.
esbuild has no `target` set, so nothing is downlevelled; don't add transpilation
workarounds for old browsers.

**Every function and variable name is at least two words.** `lookupKey` not
`key`, `parseDuration` not `parse`, `sourceEl` not `el`. The exceptions are
deliberate and must stay: `as`, `using` and `sliding` mirror the official
plugin's chain, and the `storage`, `ttl` and `prefix` option keys are public API.
Where an option key is a single word, destructure it to a two-word local
(`{ ttl: ttlValue }`).

## Architecture

`src/index.js` is the whole implementation. Everything else is packaging:

- `builds/cdn.js` — browser entry; self-registers on `alpine:init` against
  `window.Alpine`.
- `builds/module.js` — bundler entry; re-exports the plugin for
  `Alpine.plugin(persistExtended)`.
- `scripts/build.mjs` — esbuild config producing `dist/cdn.min.js`,
  `dist/module.mjs` and `dist/module.cjs`. `.mjs` because `package.json` has no
  `type` field and the script uses `import`.

Extensions are explicit because `package.json` has no `type` field. The CJS build
appends `module.exports = module.exports.default` so
`Alpine.plugin(require('alpinejs-persist-extended'))` gets the function rather
than a module namespace object. `exports`/`main`/`module` must stay in sync with
those filenames — 1.2.0 shipped only `module`, so Node resolved neither `import`
nor `require`. `dist/cdn.min.js` keeps its name deliberately: existing `@latest`
script tags point at it.

### Storage format — the load-bearing constraint

The official plugin keys storage as ``alias || `_x_${path}` `` and stores
`JSON.stringify(value)`. Every read and write here matches that byte for byte, so
a key can be shared with `$persist` or moved between the two plugins without
migration.

Expiry therefore lives in a **sidecar key** (`<lookup>__x_expires`, epoch ms)
rather than wrapping the value as `{ v, e }`. Wrapping was rejected because user
data shaped like the envelope would be indistinguishable from one, and because it
would break format compatibility. Do not switch to an envelope without solving
both.

Consequences worth remembering before changing anything:

- Two keys per expiring property means writes must stay balanced — `removeEntry`
  always clears both, and `$persistSet` with no `ttl` clears a stale sidecar.
- A fixed expiry window writes the sidecar exactly once and then never again
  (`expiresAt === null` guard in the effect), so a hot property costs the same
  number of `setItem` calls as plain `$persist`. `.sliding()` opts into a write
  per change. Don't collapse that branch.
- `$persistSet` resolves the TTL *before* the first `setItem`. A duration that
  throws mid-write would leave the value persisted with no expiry — the opposite
  of what the caller asked for.

### Other non-obvious pieces

- `resolveLookup` tries `_x_<key>` then the bare key, so callers can pass either
  an `x-data` property name or a `.as()` alias without knowing which. Writes to a
  missing key use the prefixed form.
- `Alpine.interceptor` only forwards the initial value to its callback, so
  `$persistExpire` wraps the factory to capture the TTL argument before handing
  off. `.as()`/`.using()`/`.sliding()` are attached to the interceptor object
  (Alpine's `mutateObj` hook) and mutate closure variables read later at
  initialize time, which is why chain order doesn't matter.
- `persistedKeys` collects keys before removing any. Removing while walking
  `storage.key(i)` reindexes the store and silently skips entries.
- `$persistClear` only sweeps the `_x_` namespace, so it never destroys unrelated
  app keys the way `localStorage.clear()` would. `.as()` aliases fall outside it
  by design.
- The `localStorage` fallback shim needs `removeItem`, `key` and `length`, not
  just the `getItem`/`setItem` pair the official plugin's Map fallback provides —
  delete and sweep depend on them.
