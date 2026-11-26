import { useEffect, useRef, useState } from "react"
import { getAlarm, playAlarm } from "../shared/alarm"
import { timerStore } from "../shared/data-store"
import { tickCoordinator } from "../shared/tick-coordinator"
import type { TimerState } from "../shared/utils"

// The Start/Stop button, and the countdown behind it. The time left goes to
// `onTimeLeft`, for the card's time to show.
export function CountDownTimer({ id, sound, state, startedAt, onStart, onStateChange, onTimeLeft }: {
    id: number
    sound: string | null
    state: TimerState
    startedAt: number
    onStart: () => void
    onStateChange: (state: TimerState) => void
    onTimeLeft: (seconds: number) => void
}) {
    let button = useRef<HTMLButtonElement>(null)
    let [alarmTitle, setAlarmTitle] = useState("")
    // The latest values, for effects that shouldn't re-run when they change.
    let latest = useRef({ sound, onStateChange })
    latest.current = { sound, onStateChange }

    // Running: count down from the wall clock. Re-runs when restarted
    // (`startedAt` changes); the cleanup runs on stop, alarm, or unmount.
    useEffect(() => {
        if (state !== "running") return
        let start = Math.floor(startedAt / 1e3)
        let total = timerStore.getTotalTime(id)
        onTimeLeft(total)
        tickCoordinator.subscribe(id, now => onTimeLeft(total - (now - start)))
        let timeout = setTimeout(() => latest.current.onStateChange("alarm"), total * 1e3)
        return () => {
            tickCoordinator.unsubscribe(id)
            clearTimeout(timeout)
        }
    }, [id, state, startedAt, onTimeLeft])

    // Alarm: play the sound, auto-stop after 2 minutes.
    useEffect(() => {
        if (state !== "alarm") return
        // With the focus ring, even after a mouse click (a plain focus() has none
        // then). Blurred first, since focusing the button that already has the
        // focus (Start was clicked) changes nothing.
        button.current?.blur()
        button.current?.focus({ focusVisible: true })
        let soundInfo = getAlarm(latest.current.sound, timerStore.data.allowedSounds)
        if (!soundInfo) return
        setAlarmTitle(soundInfo.title)
        let stopAudio = playAlarm(new Audio(), soundInfo)
        let autoStop = setTimeout(() => latest.current.onStateChange("stopped"), 12e4)
        return () => {
            clearTimeout(autoStop)
            stopAudio()
        }
    }, [state])

    function toggle() {
        if (state === "stopped") onStart()
        else onStateChange("stopped")
    }

    return (
        <button
            ref={button}
            className="clock"
            onClick={toggle}
            style={{ width: "140px" }}
            title={state === "alarm" ? alarmTitle : "Click to stop."}
            aria-label={state === "running" ? "Click to stop." : "Click to start."}>
            {state === "stopped" ? "Start" : "Stop"}
        </button>
    )
}
