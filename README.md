# Alpine JS Persist Extended

> [!IMPORTANT] 
> This plugin is no longer maintained or supported.

![](https://img.shields.io/bundlephobia/min/alpinejs-persist-extended)
![](https://img.shields.io/npm/v/alpinejs-persist-extended)
![](https://img.shields.io/npm/dt/alpinejs-persist-extended)
![](https://img.shields.io/github/license/markmead/alpinejs-persist-extended)

Extends the official Alpine JS `$persist` plugin with additional utilities to
help you work with `localStorage` more effectively. This plugin adds methods to
get and delete persisted data without needing to set up additional data
properties.

## Benefits

- 📌 `$persistGet`: Retrieve persisted data directly from localStorage without
  defining an x-data property
- 🗑️ `$persistDelete`: Remove items from localStorage and trigger custom events
- 🔄 Works seamlessly alongside the official Alpine JS persist plugin
- 🪶 Lightweight solution (under 1KB minified)
- ⛓️ Zero dependencies beyond Alpine JS and the official persist plugin

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

### Package

```shell
yarn add -D alpinejs-persist-extended
npm install -D alpinejs-persist-extended
```

```js
import Alpine from 'alpinejs'
import storage from 'alpinejs-persist-extended'

Alpine.plugin(storage)

window.Alpine = Alpine

Alpine.start()
```

## Example

Here's a practical example showing how to use the extended persist
functionality:

```html
<div
  x-data="{ name: $persist('Rob Brydon') }"
  @persist:delete.window="name = ''"
>
  <h2 x-text="name"></h2>

  <input type="text" x-model="name" placeholder="Enter your name" />

  <button type="button" @click="alert($persistGet('name'))">
    Show persisted name
  </button>

  <button type="button" @click="$persistDelete('name')">Reset name</button>
</div>
```

In this example:

- We initialize a persisted `name` property that saves to localStorage
- When the name is deleted, we listen for the `persist:delete` event
- We provide UI controls to view and delete the persisted data

## API Reference

### Get

```js
$persistGet('name')
```

Gets the value from `localStorage` for the provided key. This is useful when you
need to access persisted data without having to define it in your `x-data`
object.

### Delete

```js
$persistDelete('name')
```

Removes the data from `localStorage` for the specified key. When called, it also
dispatches a `persist:delete` custom event that you can listen for in your
Alpine components.

```html
<div @persist:delete.window="name = ''"></div>
```

The event listener pattern is particularly useful for resetting related data or
updating UI elements when persistence is cleared.
