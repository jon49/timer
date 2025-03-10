import { useEffect } from "react"

export function publish(name: string, data: any = null) {
  document.dispatchEvent(new CustomEvent(name, { detail: data }))
}

export function subscribe(name: string, callback: (data: any) => void, change: any[] | undefined, cleanUp: (() => void) | null = null) {
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