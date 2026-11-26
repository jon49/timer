// What the page shows that isn't saved: which timers are running or ringing,
// whose time is being edited, and which dialog is open. Saved data lives in
// `timerStore`.
import { getAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"

export type Run =
    | { state: "running", startedAt: number, end: number }
    | { state: "alarm", startedAt: number, sound?: { url: string, title: string } }

export type Dialog = { type: "global" } | { type: "timer", id: number } | null

export let runs = new Map<number, Run>()
export let ui = { dialog: null as Dialog }
export let editing = new Set<number>()

// A timer's time shows as its inputs while it's being edited, and while it's
// zero (as a new timer's is), since there's nothing to show then.
export let showsTimeEntry = (id: number) => editing.has(id) || timerStore.getTotalTime(id) === 0

export function start(id: number) {
    let startedAt = Date.now()
    runs.set(id, { state: "running", startedAt, end: startedAt + timerStore.getTotalTime(id) * 1e3 })
}

export function stop(id: number) {
    runs.delete(id)
}

export function ring(id: number) {
    let run = runs.get(id)
    if (run?.state !== "running") return
    let sound = getAlarm(timerStore.getTimer(id).sound, timerStore.data.allowedSounds)
    runs.set(id, { state: "alarm", startedAt: run.startedAt, sound })
}
