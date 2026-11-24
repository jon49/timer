import { createEffect, createSignal } from "solid-js"
import { formatClock, getAlarm, playAlarm } from "../shared/alarm"
import { timerStore } from "../shared/data-store"
import { tickCoordinator } from "../shared/tick-coordinator"
import type { TimerState } from "../shared/utils"

export function CountDownTimer(props: {
    id: number
    sound: string | null
    state: TimerState
    startedAt: number
    onStart: () => void
    onStateChange: (state: TimerState) => void
}) {
    let button!: HTMLButtonElement
    let audio!: HTMLAudioElement
    const [timeLeft, setTimeLeft] = createSignal(0)
    const [alarmTitle, setAlarmTitle] = createSignal("")

    // Running: count down from the wall clock. Re-runs when restarted
    // (`startedAt` changes); the cleanup runs on stop, alarm, or unmount.
    createEffect(
        () => props.state === "running" && {
            id: props.id,
            start: Math.floor(props.startedAt / 1e3),
            total: timerStore.getTotalTime(props.id),
        },
        run => {
            if (!run) return
            setTimeLeft(run.total)
            tickCoordinator.subscribe(run.id, now => setTimeLeft(run.total - (now - run.start)))
            const timeout = setTimeout(() => props.onStateChange("alarm"), run.total * 1e3)
            return () => {
                tickCoordinator.unsubscribe(run.id)
                clearTimeout(timeout)
            }
        })

    // Alarm: play the sound, auto-stop after 2 minutes.
    createEffect(
        () => props.state === "alarm" && { sound: props.sound },
        alarm => {
            if (!alarm) return
            button.focus()
            const soundInfo = getAlarm(alarm.sound, timerStore.data.allowedSounds)
            if (!soundInfo) return
            setAlarmTitle(soundInfo.title)
            const stopAudio = playAlarm(audio, soundInfo)
            const autoStop = setTimeout(() => props.onStateChange("stopped"), 12e4)
            return () => {
                clearTimeout(autoStop)
                stopAudio()
            }
        })

    function toggle() {
        if (props.state === "stopped") {
            props.onStart()
        } else {
            props.onStateChange("stopped")
        }
    }

    return (
        <>
            <button
                ref={button}
                onClick={toggle}
                style={{ width: "140px" }}
                title={props.state === "alarm" ? alarmTitle() : "Click to stop."}
                aria-label={props.state === "running" ? "Click to stop." : "Click to start."}>
                {props.state === "alarm"
                    ? "Stop"
                    : props.state === "stopped"
                        ? "Start"
                        : formatClock(timeLeft())}
            </button>
            <span hidden><audio ref={audio} loop /></span>
        </>
    )
}
