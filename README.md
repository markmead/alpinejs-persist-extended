# Alpine JS Persist Extended

![](https://img.shields.io/bundlephobia/minzip/alpinejs-persist-extended)
![](https://img.shields.io/npm/v/alpinejs-persist-extended)
![](https://img.shields.io/npm/dt/alpinejs-persist-extended)
![](https://img.shields.io/github/license/markmead/alpinejs-persist-extended)

Extends the official Alpine JS
[`$persist`](https://alpinejs.dev/plugins/persist) plugin with the things it
deliberately leaves out: **values that expire**, and **imperative access to
persisted keys you don't own**.

`$persist` is declarative only — the sole way to touch a key is to declare a
reactive property bound to it. That leaves two gaps this plugin fills:

- Nothing expires. "Hide this banner for 7 days" or "cache this response for an
  hour" means hand-rolling timestamps.
- A "clear my saved data" button can't reset keys owned by components that
  aren't currently on the page, because there's no property to assign to.

## Benefits

- ⏳ `$persistExpire`: `$persist` with a TTL — `'7d'`, `'30m'`, `'45s'` or raw
  milliseconds
- 📌 `$persistGet`: read a persisted key without declaring it in `x-data`
- ✏️ `$persistSet`: write a persisted key without declaring it in `x-data`
- 🗑️ `$persistDelete`: remove one key, with an event that says which
- 🧹 `$persistClear`: sweep every Alpine-persisted key, optionally by prefix
- 🤝 Byte-compatible with `$persist`'s storage format, including `.as()` and
  `.using()`
- 🪶 ~1.4KB gzipped, zero dependencies beyond Alpine JS

## Install

### CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-persist-extended@latest/dist/cdn.min.js"
></script>

<script
  defer
  src="https://unpkg.com/@alpinejs/persist@latest/dist/cdn.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@latest/dist/cdn.min.js"></script>
```

### Package Manager

```shell
pnpm add -D alpinejs-persist-extended

yarn add -D alpinejs-persist-extended

npm install -D alpinejs-persist-extended
```

```js
import Alpine from 'alpinejs'
import persist from '@alpinejs/persist'
import persistExtended from 'alpinejs-persist-extended'

Alpine.plugin(persist)
Alpine.plugin(persistExtended)

window.Alpine = Alpine

Alpine.start()
```

`@alpinejs/persist` is only required if you use `$persist` alongside this plugin.
`$persistExpire` and the imperative helpers work on their own.

## API Reference

### `$persistExpire(value, ttl)`

Works exactly like `$persist`, but the stored value is discarded once `ttl`
elapses, falling back to the initial value.

```html
<div x-data="{ dismissed: $persistExpire(false, '7d') }" x-show="!dismissed">
  <p>We use cookies, obviously.</p>

  <button type="button" @click="dismissed = true">Dismiss for a week</button>
</div>
```

`ttl` takes milliseconds, or a duration string — `ms`, `s`, `m`, `h`, `d`, `w`:

```js
$persistExpire([], 900000)
$persistExpire([], '15m')
```

Expiry is evaluated when the value is **read** — on page load, or on a
`$persistGet` — never on a timer. A value that expires while the page is open
stays in memory until the next read. An invalid duration throws immediately
rather than silently persisting forever.

The window is fixed from the first write by default. `.sliding()` restarts it on
every change instead, which is what you want for "keep this while the user is
active":

```js
$persistExpire({}, '30m').sliding()
```

`.as()` and `.using()` behave as they do in the official plugin, and chain in any
order:

```js
$persistExpire('dark', '1d').as('theme').using(sessionStorage)
```

`Alpine.$persistExpire` is available for stores, mirroring `Alpine.$persist`:

```js
Alpine.store('cart', { items: Alpine.$persistExpire([], '7d') })
```

### `$persistGet(key, fallback?, options?)`

Reads a persisted key and returns the parsed value, or `fallback` when the key
is missing or expired.

```html
<button type="button" @click="alert($persistGet('name', 'nobody'))">
  Show persisted name
</button>
```

`key` is the property name as written in `x-data` — the `_x_` prefix is added for
you. A `.as()` alias or any other raw storage key also resolves, so both of these
find the same value:

```js
$persistGet('theme') // property declared as $persist('dark')
$persistGet('my_theme') // property declared as $persist('dark').as('my_theme')
```

Values are `JSON.parse`d, matching how `$persist` wrote them. A key that isn't
valid JSON — one written by something other than Alpine — comes back as its raw
string rather than throwing.

Reads are one-shot and **not reactive**. Use it in event handlers, not in
`x-text` or `x-show`, where it won't update when storage changes. For shared
reactive state, put `$persist` in an `Alpine.store` instead.

### `$persistSet(key, value, options?)`

Writes a persisted key, in the same format `$persist` uses, with an optional TTL.

```html
<button type="button" @click="$persistSet('seenTour', true, { ttl: '30d' })">
  Don't show again
</button>
```

Dispatches `persist:set` with `{ key, value }`.

> [!IMPORTANT]
> If a mounted component owns that key via `$persist`, this does **not** update
> its in-memory value, and that component will overwrite you on its next change.
> Use it for keys nothing on the current page owns — seeding a flag for the next
> page, for example. To change state a component owns, assign to the property.

### `$persistDelete(key, options?)`

Removes a persisted key and its expiry. Returns whether the key existed, and
dispatches `persist:delete` with `{ key, existed }`.

```html
<div x-data="{ name: $persist('Rob Brydon') }">
  <h2 x-text="name"></h2>

  <button type="button" @click="$persistDelete('name')">Reset name</button>
</div>
```

The event bubbles, so listen on an ancestor or with `.window`, and use
`$event.detail.key` to tell keys apart:

```html
<div @persist:delete.window="if ($event.detail.key === '_x_name') name = ''"></div>
```

That listener is load-bearing: deleting a key can't reset the live property of a
component that owns it, so a mounted `$persist` property keeps its value — and
rewrites it to storage on its next change — until you clear it yourself.

### `$persistClear(options?)`

Removes every key in Alpine's `_x_` namespace. Returns the removed keys and
dispatches `persist:clear` with `{ keys }`.

```html
<button type="button" @click="$persistClear()">Clear saved data</button>
```

Unlike `localStorage.clear()`, this leaves keys your app stores outside that
namespace alone. Scope it further with a prefix:

```js
$persistClear({ prefix: 'cart' }) // clears _x_cartItems, _x_cartTotal, ...
```

Keys renamed with `.as()` fall outside the `_x_` namespace and are not swept —
remove those with `$persistDelete`.

### Options

`$persistGet`, `$persistSet`, `$persistDelete` and `$persistClear` all take a
trailing options object:

| Option    | Applies to        | Default        | Description                          |
| --------- | ----------------- | -------------- | ------------------------------------ |
| `storage` | all               | `localStorage` | Any `Storage`, e.g. `sessionStorage` |
| `ttl`     | `$persistSet`     | none           | Duration string or milliseconds      |
| `prefix`  | `$persistClear`   | `''`           | Restrict the sweep within `_x_`      |

Each helper is also exposed on the Alpine object for use outside markup —
`Alpine.persistGet`, `Alpine.persistSet`, `Alpine.persistDelete`,
`Alpine.persistClear`. Events from those dispatch off the document root, so
`.window` listeners still fire.

### Storage format

Values are stored exactly as `$persist` stores them: `JSON.stringify(value)`
under `_x_<property>`. Expiry lives in a sidecar key,
`_x_<property>__x_expires`, holding an epoch milliseconds timestamp. Nothing
wraps the value, so a key can be moved between `$persist` and `$persistExpire`
without a migration, and `$persistGet` reads keys written by either.

When `localStorage` is unavailable — Safari private mode, blocked cookies — the
plugin warns once and falls back to in-memory storage for that page load rather
than throwing.

## Breaking Changes in 2.0.0

- **`$persistGet` now parses values.** It previously returned the raw string, so
  `$persist('Rob Brydon')` read back as `"Rob Brydon"` including the quote
  characters, and objects came back as JSON text. If you were working around
  that with `JSON.parse($persistGet('key'))`, drop the `JSON.parse`.
- **`$persistGet` and `$persistDelete` resolve `.as()` aliases and other raw
  keys**, where before they only ever looked at `_x_<key>`.
- **`$persistGet` returns `undefined`, not `null`**, for a missing key, and takes
  a `fallback` argument.
- **`$persistDelete` returns a boolean** and its `persist:delete` event now
  carries `detail: { key, existed }`. The event is no longer `cancelable`;
  nothing read that flag.
- **Both helpers honour expiry**, sweeping and skipping an expired key.
- **`dist/esm.min.js` is gone**, replaced by `dist/module.mjs` and
  `dist/module.cjs` behind an `exports` map — 1.2.0 declared only `module`, so
  neither `require()` nor Node ESM `import` resolved. Package-name imports are
  unaffected; update any deep imports of the old path. `dist/cdn.min.js` is
  unchanged, so CDN users need no changes.
