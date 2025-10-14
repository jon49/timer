import { soundOptions } from "../shared/sounds.js"
import { formatTime } from "../shared/utils.js"

export function formatClock(time: number): string {
    if (time < 1) return "00:00:00"
    let hours = Math.floor(time / 3600)
    let minutes = Math.floor((time % 3600) / 60)
    let seconds = time % 60
    return `${formatTime(hours, "00")}:${formatTime(minutes, "00")}:${formatTime(seconds, "00")}`
}

let alarmIds = soundOptions.slice(1).map(([value]) => value)
export function getAlarm(sound: string | null, allowedSounds: string[]): { url: string, title: string } | undefined {
    if (!sound) {
        let allowedAlarms = alarmIds.filter(x => allowedSounds.length === 0 || allowedSounds.includes(x))
        return getAlarm(allowedAlarms[Math.floor(Math.random() * allowedAlarms.length)], allowedSounds)
    }
    let alarm = soundOptions.find(([name]) => name === sound)
    if (!alarm) return
    return { url: alarm[2], title: alarm[1] }
}