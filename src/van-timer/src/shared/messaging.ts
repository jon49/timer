interface Message {
  clockAlarm: number
  clockRestarted: number
  clockStarted: number
  clockStopped: number
  deleteTimer: number
  dialogClosed: null
  newTimer: null
  dialogClosing: null
  unsubscribe: { key: string | number }
  timerAdded: number
}

export function publish<K extends keyof Message>(name: K, data: Message[K] | null = null, el: HTMLElement | null = null) {
  if (el) {
    el.dispatchEvent(new CustomEvent(name as string, { detail: data, bubbles: true }))
    return
  }
  document.dispatchEvent(new CustomEvent(name as string, { detail: data }))
}

const eventCleanup: Map<string | number, (() => void)[]> = new Map()

// @ts-ignore
document.addEventListener("unsubscribe", (e: CustomEvent) => {
  let key = e.detail?.key
  if (!key) return
  for (let handler of eventCleanup.get(key) || []) {
    handler()
  }
  eventCleanup.delete(e.detail.key)
})

export function subscribe<K extends keyof Message>(
  name: K,
  callback: (data: Message[K]) => void,
  key: string | number | null = null,
  cleanup: (() => void) | null = null) {
  let handler = (e: CustomEvent) => callback(e.detail)
  // @ts-ignore
  document.addEventListener(name, handler)
  if (!key) return
  if (!eventCleanup.has(key)) {
    eventCleanup.set(key, [])
  }
  let cleanups = eventCleanup.get(key)
  cleanups?.push(() => {
    // @ts-ignore
    document.removeEventListener(name, handler)
    if (cleanup) cleanup()
  })
}