'use strict'

const secret = {
  config: Symbol('ref config')
}
const watchedAnchors = new Set()

window.addEventListener('route', onRoute)

function onRoute (ev) {
  const view = ev.detail.to
  const level = ev.target.$routerLevel
  for (let anchor of watchedAnchors) {
    updateActivity(anchor, view, level)
  }
}

updateHistory(pathToRoute(location.pathname), queryToParams(location.search), {history: false})

function ref (elem) {
  if (elem.nodeType !== 1) return

  elem.$route = $route
  if (elem.tagName === 'A') {
    elem.$attribute('iref', irefAttribute)
    elem.$attribute('iref-params', irefParamsAttribute)
    elem.$attribute('iref-options', irefOptionsAttribute)

    if (elem.$hasAttribute('iref')) {
      watchedAnchors.add(elem)
      elem.$cleanup(unwatch)
    }
  }
}
ref.$name = 'ref'
ref.$require = ['attributes']
module.exports = ref

function unwatch () {
  watchedAnchors.delete(this)
}

function irefAttribute (path) {
  const config = this[secret.config] = this[secret.config] || {}
  let route = pathToRoute(path)
  if (route.some(filterRelativeTokens)) {
    route = relativeToAbsoluteRoute(this, route)
  }
  config.route = route
  this.href = routeToPath(route) + (this.search || '')
  this.addEventListener('click', onClick, true)
}

function irefParamsAttribute (params) {
  const config = this[secret.config] = this[secret.config] || {}
  config.params = params
  this.href = (this.pathname || '') + paramsToQuery(params)
  this.addEventListener('click', onClick, true)
}

function irefOptionsAttribute (options) {
  const config = this[secret.config] = this[secret.config] || {}
  config.options = options
}

function onClick (ev) {
  const config = this[secret.config]
  updateHistory(config.route, config.params, config.options)
  ev.preventDefault()
}

function updateActivity (anchor, view, level) {
  const config = anchor[secret.config]
  level = level - 1
  if (config.route[level] === view) {
    anchor.classList.add('active')
  } else if (config.route[level]) {
    anchor.classList.remove('active')
  }
}

function $route (path, params, options) {
  let route = pathToRoute(path)
  if (route.some(filterRelativeTokens)) {
    route = relativeToAbsoluteRoute(this, route)
  }
  updateHistory(route, params, options)
}

function relativeToAbsoluteRoute (node, relativeRoute) {
  let router = findParentRouter(node)
  let routerLevel = router ? router.$routerLevel : 0

  for (let token of relativeRoute) {
    if (token === '..') routerLevel--
  }
  if (routerLevel < 0) {
    throw new Error('invalid relative route')
  }

  const currentRoute = []
  while (router) {
    currentRoute.unshift(router.$currentView)
    router = findParentRouter(router)
  }
  const route = relativeRoute.filter(filterAbsoluteTokens)
  return currentRoute.slice(0, routerLevel).concat(route)
}

function filterAbsoluteTokens (token) {
  return (token !== '..' && token !== '.')
}

function filterRelativeTokens (token) {
  return (token === '..' || token === '.')
}

function filterEmptyTokens (token) {
  return (token !== '')
}

function findParentRouter (node) {
  node = node.parentNode
  while (node && node.$routerLevel === undefined) {
    node = node.parentNode
  }
  return node
}

function updateHistory (route, params, options) {
  params = params || {}
  options = options || {}

  if (options.inherit) {
    params = Object.assign({}, history.state.params, params)
  }

  const url = routeToPath(route) + paramsToQuery(params)
  if (options.history === false) {
    history.replaceState({route, params}, '', url)
  } else {
    history.pushState({route, params}, '', url)
  }

  const eventConfig = {bubbles: true, cancelable: false }
  document.dispatchEvent(new Event('popstate', eventConfig))
  window.scroll(0, 0)
}

function routeToPath (route) {
  return route ? '/' + route.join('/') : ''
}

function pathToRoute (path) {
  return path.split('/').filter(filterEmptyTokens)
}

function paramsToQuery (params) {
  params = params || {}
  let query = ''
  for (let paramName in params) {
    const param = params[paramName]
    if (param !== undefined) {
      query += `${paramName}=${param}&`
    }
  }
  if (query !== '') {
    query = '?' + query.slice(0, -1)
  }
  return query
}

function queryToParams (query) {
  if (query[0] === '?') {
    query = query.slice(1)
  }
  query = query.split('&')

  const params = {}
  for (let keyValue of query) {
    keyValue = keyValue.split('=')
    if (keyValue.length === 2) {
      params[keyValue[0]] = keyValue[1]
    }
  }
  return params
}
