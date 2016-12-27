export function domify (string, listeners = {}, children = {}) {
  const el = document.createElement('div')
  el.innerHTML = string
  if (Object.keys(listeners).length) {
    Object.keys(listeners).forEach((cur) => {
      el.firstChild.addEventListener(cur, listeners[cur].func)
    })
  }
  if (Object.keys(children).length) {
    Object.keys(children).forEach((child) => {
      const childEl = el.firstChild.querySelector(child)
      if (childEl) {
        if (childEl.props) {
          Object.keys(childEl.props).forEach((prop) => {
            childEl[prop] = childEl.props[prop]
          })
        }
      }
    })
  }
  return el.firstChild
}
