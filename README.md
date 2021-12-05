# Alpine JS Persist Extended

Alpine JS magic method `$storage` extends the official `$persist` plugin to help you work with local storage 📦

You aren't required to use the `$persist` plugin.

## Example 👀

```html
<div
  x-data="{ count: $persist(0) }"
  x-on:storage-delete-count.window="count = $storage('_x_count', 'GET')"
>
  <h2>Count: <span x-text="count"></span></h2>

  <button x-on:click="count++">+</button>

  <button x-on:click="count--">-</button>

  <button x-on:click="alert($storage('_x_count', 'GET'))">Alert</button>

  <button x-on:click="$storage('_x_count', 'DELETE')">Reset</button>
</div>
```

### GET

```js
$storage("_x_count", "GET");
```

Gets the value passed (`_x_count`) from local storage.

_Alpine JS data saved to local storage is prefixed with `\_x_`when using the`$persist` plugin.\_

### DELETE

```js
$storage("_x_count", "DELETE");
```

Deletes the value passed (`_x_count`) from local storage and emits two events.

```html
<div x-on:storage-delete.window="..."></div>

<div x-on:storage-delete-count.window="..."></div>
```

#### General

`x-on:storage-delete.window`

General for when local storage data is deleted with the plugin.

#### Specific

`x-on:storage-delete-count.window`

For when specific data from local storage is deleted. It convers the name:

| Alpine JS Key | Event Name                   |
| ------------- | ---------------------------- |
| count         | storage-delete-count         |
| currentCount  | storage-delete-current-count |

## Install 🌟

It's very easy to install Alpine JS plugins! 🙌

### CDN

```html
<script
  defer
  src="https://unpkg.com/alpinejs-persist-extended@1.0.0/dist/count.min.js"
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
import Alpine from "alpinejs";
import storage from "alpinejs-persist-extended";

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
