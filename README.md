# The ref middleware

The `ref` middleware is responsible for handling internal references.

- name: ref
- middleware dependencies: [attributes](https://github.com/nx-js/attributes-middleware)
- all middleware dependencies: [observe](https://github.com/nx-js/observe-middleware), [attributes](https://github.com/nx-js/attributes-middleware)
- type: component or content middleware
- ignores: text nodes
- [docs](http://nx-framework.com/docs/middlewares/route)

## Installation

`npm install @nx-js/ref-middleware`

## Usage

```js
const component = require('@nx-js/core')
const observe = require('@nx-js/observe-middleware')
const attributes = require('@nx-js/attributes-middleware')
const ref = require('@nx-js/ref-middleware')

component()
  .useOnContent(observe)
  .useOnContent(attributes)
  .useOnContent(ref)
  .register('nav-comp')
```

```html
<nav-comp>
  <a iref="profile">Profile</a>
  <a iref="settings">Settings</a>
</nav-comp>
```
