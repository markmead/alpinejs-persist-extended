# Alpine JS Persist Extended

Alpine JS magic method `$storage` extends the official `$persist` plugin to help you work with local storage 📦

## Example 👀

```html
<div
  x-data="{ name: $persist('') }"
  x-on:storage-delete.window="name = $storage('name')"
>
  <h2 x-text="name"></h2>

  <input type="text" x-model="name" />

  <button x-on:click="alert($storage('name'))">Alert Name</button>

  <button x-on:click="$storage('name', 'delete')">Delete Name</button>
</div>
```

### Get

```js
$storage('name');
```

Gets the value from local storage of the provided key. It's not required, but you can pass `'get'` as a second parameter.

### Delete

```js
$storage('name', 'delete');
```

Delete the data from local storage. This also emits an event that you can listen for in Alpine JS.

```html
<div x-on:storage-delete.window="name = $storage('name')"></div>
```

## Install 🌟

It's very easy to install Alpine JS plugins! 🙌

### CDN

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

### NPM/Yarn

```shell
npm i -D alpinejs-persist-extended

yarn add -D alpinejs-persist-extended
```

Then you can register the plugin.

```js
import Alpine from 'alpinejs';
import storage from 'alpinejs-persist-extended';

Alpine.plugin(storage);

window.Alpine = Alpine;

Alpine.start();
```

### Stats 📊

Here's some stats about the Alpine JS Persist Extended package! As you can see, it's tiny 🤏

![](https://img.shields.io/bundlephobia/min/alpinejs-persist-extended)
![](https://img.shields.io/npm/v/alpinejs-persist-extended)
![](https://img.shields.io/npm/dt/alpinejs-persist-extended)
![](https://img.shields.io/github/license/markmead/alpinejs-persist-extended)
