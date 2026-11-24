// What the page shows that isn't saved: which timers are running or ringing,
// and which dialog is open. Saved data lives in `timerStore`.
import { getAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"

export type Run =
    | { state: "running", startedAt: number, end: number }
    | { state: "alarm", startedAt: number, sound?: { url: string, title: string } }

export type Dialog = { type: "global" } | { type: "timer", id: number } | null

export let runs = new Map<number, Run>()
export let ui = { dialog: null as Dialog }

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
