export type TimerState = "stopped" | "running" | "alarm" | "deleting"

export function formatTime(time: number, defaultValue = "") {
    if (!time) return defaultValue
    return ("" + time).padStart(2, "0")
}
