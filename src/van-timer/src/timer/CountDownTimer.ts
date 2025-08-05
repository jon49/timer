import { publish, subscribe } from "../shared/messaging"
import { timerStore } from "../shared/data-store"
import { tickCoordinator } from "../shared/tick-coordinator"
import { soundOptions } from "../shared/sounds"
import { formatTime, TimerState } from "../shared/utils"
import van from "vanjs-core"

let { audio, button, span } = van.tags
let { state } = van

export function CountDownTimer(id: number) {
    let audioEl: HTMLAudioElement = audio({ loop: true })
    let timerState = state<TimerState>("stopped")
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

    subscribe("clockStarted", (timerId: number) => {
        if (timerId !== id) return
        let now = Math.floor(Date.now() / 1e3)
        totalTime.val = timerStore.getTotalTime(id)
        clockStartedTime.val = now
        timerState.val = "running"
        timeLeft.val = totalTime.rawVal
        tickCoordinator.subscribe(id, tick)
        timeoutId.val = setTimeout(() => publish("clockAlarm", id), totalTime.rawVal * 1e3)
    }, id, () => { tickCoordinator.unsubscribe(id); timeoutId.val && clearTimeout(timeoutId.val) })

    subscribe("clockRestarted", (timerId: number) => {
        if (timerId !== id) return
        publish("clockStopped", id)
        publish("clockStarted", id)
    }, id)

    subscribe("clockAlarm", (timerId: number) => {
        if (timerId !== id) return
        tickCoordinator.unsubscribe(id)

        let timer = timerStore.getTimer(id)
        let info = timerStore.data
        let soundInfo = getAlarm(timer.sound, info.allowedSounds)
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
        alarmTimeoutId = setTimeout(() => publish("clockStopped", id), 12e4)

        audioEl.play()
            .catch(x => console.error("Audio failed to start.", x))

        timerState.val = "alarm"
    }, id)

    subscribe("clockStopped", (timerId: number) => {
        if (timerId !== id) return
        if (timeoutId.val) {
            clearTimeout(timeoutId.val)
        }
        if (alarmTimeoutId) {
            clearTimeout(alarmTimeoutId)
            alarmTimeoutId = null
        }
        timerState.val = "stopped"
        audioEl.pause()
        tickCoordinator.unsubscribe(id)
    }, id)

    let $timer: HTMLButtonElement

    return [
        ($timer = button({
            onclick: () => publish("clockStopped", id),
            hidden: () => timerState.val !== "running" && timerState.val !== "alarm",
            style: "width: 140px",
            title: () => timerState.val === "alarm" ? audioEl.title : "Click to stop.",
            ariaLabel: "Click to stop."
        }, () => {
            if (timerState.val === "alarm") {
                $timer.focus()
                return "Stop"
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