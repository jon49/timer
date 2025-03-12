import { useRef, useState } from "react"
import { timerStore, useTimer } from "../shared/data-store"
import { publish, subscribe } from "../shared/messaging"
import { tickCoordinator } from "../shared/tick-coordinator"
import useStateRef from "react-usestateref"

export function Timer({ id }: { id: number }) {
    let [timer, setTimer] = useTimer(id)
    let [hours, setHours] = useState(timer.hours)
    let [minutes, setMinutes] = useState(timer.minutes)
    let [seconds, setSeconds] = useState(timer.seconds)
    let [timerState, setTimerState] = useState<TimerState>("stopped")

    let hourDisplay = () => formatTime(hours)
    let minuteDisplay = () => formatTime(minutes)
    let secondDisplay = () => formatTime(seconds)

    function setValue(name: "hours" | "minutes" | "seconds") {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            let value = +e.target.value
            timer[name] = value
            switch (name) {
                case "hours": setHours(value); break
                case "minutes": setMinutes(value); break
                case "seconds": setSeconds(value); break
            }
            setTimer(timer)
        }
    }

    subscribe("clockStopped", (timerId: number) => {
        if (timerId !== id) return
        setTimerState("stopped")
    }, [])

    subscribe("clockStarted", (timerId: number) => {
        if (timerId !== id) return
        setTimerState("running")
    }, [])

    return (
        <>
            <header>
                <label>
                    <input data-action="save" className="plain w-auto" name="title" type="text" placeholder="Title" />
                    <span className="editable-pencil">&#9998;</span>
                </label>
            </header>
            <div className="flex justify-between">

                <div className="inline reverse">

                    <CountDownTimer id={id} />

                    <fieldset className="time-entry m-0" role="group">
                        <input className="plain clock" onChange={setValue("hours")} value={hourDisplay()} name="hours" type="number" placeholder="h" />
                        <input className="plain clock" onChange={setValue("minutes")} value={minuteDisplay()} name="minutes" type="number" placeholder="m" />
                        <input className="plain clock" onChange={setValue("seconds")} value={secondDisplay()} name="seconds" type="number" placeholder="s" />
                    </fieldset>
                </div>

                <div className="flex">
                    <button onClick={() => { setTimerState("running"); publish("clockStarted", id) }} hidden={timerState !== "stopped"}>Start</button>
                    <button onClick={() => publish("clockRestarted", id)} hidden={timerState === "stopped"}>&#8635;</button>
                    {/* x=settingsEl */}
                    <button data-action="editSettings">&#9881;</button>
                    <button onClick={() => publish("deleteTimer", id)}>❌</button>
                </div>

            </div>
        </>
    )
}

function CountDownTimer({ id }: { id: number }) {
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
        setTimerState("alarm")
        audioEl?.current?.play()
        console.log("alarm")
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
                title="Click to stop."
                aria-label="Click to stop.">{(() => {
                    if (timerState.current === "alarm") return "Alarm!"
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

function formatTime(time: number, defaultValue = "") {
    if (!time) return defaultValue
    return ("" + time).padStart(2, "0")
}

type TimerState = "stopped" | "running" | "alarm"
