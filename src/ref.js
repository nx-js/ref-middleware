'use strict'

const dom = require('@nx-js/dom-util')
const util = require('@nx-js/router-util')
const symbols = require('./symbols')
const activity = require('./activity')

const popstateConfig = { bubbles: true, cancelable: false }

// init history
const initialRoute = util.toRoute(location.pathname)
const initialParams = util.toParams(location.search)
updateHistory(initialRoute, initialParams, {history: false})

function ref (elem) {
  if (elem.nodeType !== 1) return

  elem.$route = $route
  if (elem.tagName === 'A') {
    elem.$attribute('iref-params', irefParamsAttribute)
    elem.$attribute('iref-options', irefOptionsAttribute)
    elem.$attribute('iref', irefAttribute)

    if (elem.$hasAttribute('iref')) {
      const parentLevel = dom.findAncestorProp(this, '$routerLevel')
      this[symbols.config] = {
        level: (parentLevel === undefined) ? 0 : parentLevel + 1,
        routeMismatches: new Set(),
        paramsMatch: true
      }
      activity.register(elem)
      elem.$cleanup(activity.unregister, elem)
    } else if (elem.$hasAttribute('iref-params') || elem.$hasAttribute('iref-options')) {
      throw new Error ('The iref attribute is mandatory for iref-params and iref-options.')
    }
  }
}
ref.$name = 'ref'
ref.$require = ['attributes']
module.exports = ref

function irefAttribute (path) {
  const config = this[symbols.config]
  config.route = util.toAbsolute(util.toRoute(path), config.level)

  const route = history.state.route
  for (let i = 0; i <= config.level; i++) {
    activity.updateRouteMatch(this, route[i], i)
  }
  this.href = util.toPath(config.route) + (this.search || '')
  this.addEventListener('click', onAnchorClick, true)
}

function irefParamsAttribute (params) {
  this[symbols.config].params = params
  activity.updateParamsMatch(this)
  this.href = (this.pathname || '') + util.toQuery(params)
  this.addEventListener('click', onAnchorClick, true)
}

function irefOptionsAttribute (options) {
  this[symbols.config].options = options
}

function onAnchorClick (ev) {
  const config = this[symbols.config]
  if (!config.isActive) {
    updateHistory(config.route, config.params, config.options)
  }
  ev.preventDefault()
}

function $route (path, params, options) {
  const parentLevel = dom.findAncestorProp(this, '$routerLevel')
  const level = (parentLevel === undefined) ? 0 : parentLevel + 1
  const route = util.toAbsolute(util.toRoute(path), level)
  setTimeout(updateHistory, 0, route, params, options)
}

function updateHistory (route, params, options) {
  params = params || {}
  options = options || {}

  if (options.inherit) {
    params = Object.assign(history.state.params, params)
  }
  const url = util.toPath(route)
  util.updateState({route, params}, '', url, (options.history !== false))
  document.dispatchEvent(new Event('popstate', popstateConfig))
  window.scroll(0, 0)
}
