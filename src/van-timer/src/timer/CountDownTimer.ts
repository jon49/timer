import { timerStore } from "../shared/data-store"
import { tickCoordinator } from "../shared/tick-coordinator"
import { soundOptions } from "../shared/sounds"
import { formatTime, TimerState } from "../shared/utils"
import van from "vanjs-core"
import type { State } from "vanjs-core"
import type { TimerData } from "../shared/types"

let { audio, button, span } = van.tags
let { state, derive } = van

export function CountDownTimer(id: number, timer: State<TimerData>, timerState: State<TimerState>) {
    let audioEl: HTMLAudioElement = audio({ loop: true })
    let clockStartedTime = state(0)
    let totalTime = state(0)
    let timeLeft = state(0)
    let timeoutId = state<number | null>(null)
    let alarmTimeoutId: number | null = null

    function tick(now: number) {
        let timeElapsed = Math.floor(now - clockStartedTime.rawVal)
        let newTimeLeft = totalTime.rawVal - timeElapsed
        timeLeft.val = newTimeLeft
    }

    derive(() => {
        if (timerState.val !== "running") return
        let now = Math.floor(Date.now() / 1e3)
        totalTime.val = timerStore.getTotalTime(id)
        clockStartedTime.val = now
        timeLeft.val = totalTime.rawVal
        tickCoordinator.subscribe(id, tick)
        timeoutId.val = setTimeout(() => timerState.val = "alarm", totalTime.rawVal * 1e3)
    })

    derive(() => {
        if (timerState.val !== "deleting") return
        tickCoordinator.unsubscribe(id)
        clearTimeout(timeoutId.val ?? 0)
    })

    derive(() => {
        if (timerState.val !== "alarm") return
        tickCoordinator.unsubscribe(id)

        let info = timerStore.data
        let soundInfo = getAlarm(timer.rawVal.sound, info.allowedSounds)
        if (!soundInfo) return

        if (timeoutId.val) {
            clearTimeout(timeoutId.val)
        }
        timeoutId.val = null

        audioEl.title = soundInfo.title
        audioEl.src = soundInfo.url
        let volume = 1
        audioEl.volume = volume / 100
        let audioFadeIn = setInterval(() => {
            if (audioEl && volume < 100) {
                volume += 1
                audioEl.volume = volume / 100
            } else {
                clearInterval(audioFadeIn)
            }
        }, 1200)

        // Stop audio after 2 minutes
        alarmTimeoutId = setTimeout(() => timerState.val = "stopped", 12e4)

        audioEl.play()
            .catch(x => console.error("Audio failed to start.", x))
    })

    derive(() => {
        if (timerState.val !== "stopped") return
        if (timeoutId.val) {
            clearTimeout(timeoutId.val)
        }
        if (alarmTimeoutId) {
            clearTimeout(alarmTimeoutId)
            alarmTimeoutId = null
        }
        audioEl.pause()
        tickCoordinator.unsubscribe(id)
    })

    let $timer: HTMLButtonElement

    return [
        ($timer = button({
            onclick: () => timerState.val = timerState.val === "stopped" ? "running" : "stopped",
            style: "width: 140px",
            title: () => timerState.val === "alarm" ? audioEl.title : "Click to stop.",
            ariaLabel: () => timerState.val === "running" ? "Click to stop." : "Click to start."
        }, () => {
            if (timerState.val === "alarm") {
                $timer.focus()
                return "Stop"
            } else if (timerState.val === "stopped") {
                return "Start"
            }
            return formatClock(timeLeft.val)
        })),
        span({ hidden: true }, audioEl)
    ]
}

function formatClock(time: number): string {
    if (time < 1) return "00:00:00"
    let hours = Math.floor(time / 3600)
    let minutes = Math.floor((time % 3600) / 60)
    let seconds = time % 60
    return `${formatTime(hours, "00")}:${formatTime(minutes, "00")}:${formatTime(seconds, "00")}`
}

let alarmIds = soundOptions.slice(1).map(([value]) => value)
function getAlarm(sound: string | null, allowedSounds: string[]): { url: string, title: string } | undefined {
    if (!sound) {
        let allowedAlarms = alarmIds.filter(x => allowedSounds.length === 0 || allowedSounds.includes(x))
        return getAlarm(allowedAlarms[Math.floor(Math.random() * allowedAlarms.length)], allowedSounds)
    }
    let alarm = soundOptions.find(([name]) => name === sound)
    if (!alarm) return
    return { url: alarm[2], title: alarm[1] }
}