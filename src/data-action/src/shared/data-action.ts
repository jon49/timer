document.addEventListener("click", e => {
  let target = e.target
  let action: string | undefined
  if (!(target instanceof HTMLButtonElement && (action = target.dataset.action))) return

  handleCall(e, target, action)
})

document.addEventListener("change", e => {
  let target = e.target
  let action: string | undefined
  if (!((target instanceof HTMLInputElement || target instanceof HTMLSelectElement) && (action = target.dataset.action))) return

  if (handleCall(e, target, action)) {
    e.preventDefault()
  }
})

window.dataAction = function dataAction(e: Event) {
  let target = e.target
  let action: string | undefined
  if (!((target instanceof HTMLElement) && (action = target.dataset.action))) return

  if (handleCall(e, target, action)) {
    e.preventDefault()
  }
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

  console.warn(`DATA-ACTION: Could not find function ${action}. Target element`, target)
}