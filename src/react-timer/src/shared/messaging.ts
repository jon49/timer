import { useEffect } from "react"

interface Message {
  clockAlarm: number
  clockRestarted: number
  clockStarted: number
  clockStopped: number
  deleteTimer: number
  dialogClosed: null
  newTimer: null
}

export function publish<K extends keyof Message>(name: K, data: Message[K] | null = null) {
  document.dispatchEvent(new CustomEvent(name as string, { detail: data }))
}

export function subscribe<K extends keyof Message>(
  name: K,
  callback: (data: Message[K]) => void,
  change: any[] | undefined,
  cleanUp: (() => void) | null = null) {
  let handler = (e: CustomEvent) => callback(e.detail)
  useEffect(() => {
    // @ts-ignore
    document.addEventListener(name, handler)
    return () => {
      if (cleanUp) cleanUp()
      // @ts-ignore
      document.removeEventListener(name, handler)
    }

  }, change)
}