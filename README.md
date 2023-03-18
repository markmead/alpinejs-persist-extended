# Alpine JS Persist Extended

Extends the official `$persist` plugin to help you work with `localStorage` 📦

## Install

### With a CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-persist-extended@latest/dist/storage.min.js"
></script>

<script
  defer
  src="https://unpkg.com/@alpinejs/persist@3.x.x/dist/cdn.min.js"
></script>

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### With a Package Manager

```shell
npm i -D alpinejs-persist-extended

yarn add -D alpinejs-persist-extended
```

```js
import Alpine from 'alpinejs'
import storage from 'alpinejs-persist-extended'

Alpine.plugin(storage)

window.Alpine = Alpine

Alpine.start()
```

## Example

```html
<div
  x-data="{ fullName: $persist('') }"
  @persist:delete.window="fullName = $persistGet('fullName')"
>
  <h2 x-text="fullName"></h2>

  <input type="text" x-model="fullName" />

  <button @click="alert($persistGet('fullName'))">Alert Name</button>

  <button @click="$persistDelete('fullName')">Delete Name</button>
</div>
```

### Get

```js
$persistGet('fullName')
```

Gets the value from `localStorage` of the provided key.

### Delete

```js
$persistDelete('fullName')
```

Deletes the data from `localStorage`, it also emits an event that you can listen
for in Alpine JS.

```html
<div @persist:delete.window="fullName = $persistGet('fullName')"></div>
```

### Stats

![](https://img.shields.io/bundlephobia/min/alpinejs-persist-extended)
![](https://img.shields.io/npm/v/alpinejs-persist-extended)
![](https://img.shields.io/npm/dt/alpinejs-persist-extended)
![](https://img.shields.io/github/license/markmead/alpinejs-persist-extended)
