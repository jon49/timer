import { useRef } from "react"
import useStateRef from "react-usestateref"
import { publish, subscribe } from "../shared/messaging"
import { timerStore } from "../shared/data-store"
import { tickCoordinator } from "../shared/tick-coordinator"
import { soundOptions } from "../shared/sounds"
import { formatTime, TimerState } from "./shared"

export function CountDownTimer({ id }: { id: number }) {
    let audioEl = useRef<HTMLAudioElement>(null)
    let [, setTimerState, timerState] = useStateRef<TimerState>("stopped")
    let [, setClockStartedTime, clockStartedTime] = useStateRef(0)
    let [, setTotalTime, totalTimeRef] = useStateRef(0)
    let [, setTimeLeft, timeLeft] = useStateRef(0)
    let [, setTimeoutId, timeoutId] = useStateRef<number | null>(null)

    function tick(now: number) {
        let timeElapsed = Math.floor(now - clockStartedTime.current)
        let newTimeLeft = totalTimeRef.current - timeElapsed
        console.log("NEW TIME LEFT", newTimeLeft)
        setTimeLeft(newTimeLeft)
    }

    subscribe("clockStarted", (timerId: number) => {
        if (timerId !== id) return
        let now = Math.floor(Date.now() / 1e3)
        let totalTime = timerStore.getTotalTime(id)
        setTotalTime(totalTime)
        setClockStartedTime(now)
        setTimerState("running")
        setTimeLeft(totalTime)
        tickCoordinator.subscribe(id, tick)
        setTimeoutId(setTimeout(() => publish("clockAlarm", id), totalTime * 1e3))
    }, [], () => { tickCoordinator.unsubscribe(id); timeoutId.current && clearTimeout(timeoutId.current) })

    subscribe("clockRestarted", (timerId: number) => {
        if (timerId !== id) return
        publish("clockStopped", id)
        publish("clockStarted", id)
    }, [])

    subscribe("clockAlarm", (timerId: number) => {
        if (timerId !== id) return
        tickCoordinator.unsubscribe(id)
        setTimeoutId(null)

        let timer = timerStore.getTimer(id)
        let info = timerStore.data
        let soundInfo = getAlarm(timer.sound, info.allowedSounds)
        if (!soundInfo) return

        if (timeoutId.current) {
            clearTimeout(timeoutId.current)
        }
        setTimeoutId(null)

        let audio = audioEl.current
        if (!audio) return
        audio.title = soundInfo.title
        audio.src = soundInfo.url
        let volume = 1
        audio.volume = volume / 100
        let audioFadeIn = setInterval(() => {
            if (volume < 100 && audio) {
                volume += 1
                audio.volume = volume / 100
            } else {
                clearInterval(audioFadeIn)
            }
        }, 1200)

        audio.play()
            .then(_ => console.log("Audio started."))
            .catch(x => console.error("Audio failed to start.", x))

        setTimerState("alarm")
    }, [])

    subscribe("clockStopped", (timerId: number) => {
        if (timerId !== id) return
        if (timeoutId.current) {
            clearTimeout(timeoutId.current)
        }
        setTimerState("stopped")
        audioEl?.current?.pause()
        tickCoordinator.unsubscribe(id)
    }, [])

    return (
        <>
            <button
                onClick={() => publish("clockStopped", id)}
                hidden={timerState.current !== "running" && timerState.current !== "alarm"}
                style={{ width: "140px" }}
                title={timerState.current === "alarm" ? audioEl.current?.title : "Click to stop."}
                aria-label="Click to stop.">{(() => {
                    if (timerState.current === "alarm") {
                        return "Stop"
                    }
                    return formatClock(timeLeft.current)
                })()}</button>

            <span hidden>
                <audio ref={audioEl} loop></audio>
            </span>
        </>
    )
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