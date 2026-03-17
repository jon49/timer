for (let event of ["click", "change"]) {
  document.addEventListener(event, e => {
    let target = e.target
    let action = findAttr(target, event)
    if (!action) return

    // @ts-ignore
    if (handleCall(e, target, action)) {
      e.preventDefault()
    }
  })
}

window.dataAction = function dataAction(e: Event) {
  let target = e.target
  let action = findAttr(target, e.type)
  if (!action) return

  // @ts-ignore
  if (handleCall(e, target, action)) {
    e.preventDefault()
  }
}

function findAttr(target: EventTarget | null, attr: string): string | null | undefined {
  // @ts-ignore
  return target?.closest?.(`[_${attr}]`)?.getAttribute(`_${attr}`)
}

function handleCall(
  e: Event,
  target: HTMLElement,
  action: string) {
  let fn: Function | undefined = target.app?.[action]
  if (fn) {
    fn.call(target.app, e)
    return 1
  }

  let root = target.closest("[data-root]")

  fn = root?.app?.[action]
  if (fn && root?.app) {
    fn.call(root.app, e)
    return 1
  }

  fn = window.app?.[action]
  if (fn) {
    fn.call(window.app, e)
    return 1
  }

  console.warn(`ACTION: Could not find function ${action}. Target element`, target)
}