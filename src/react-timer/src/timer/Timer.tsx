import { useState } from "react"
import { useTimer } from "../shared/data-store"
import { publish, subscribe } from "../shared/messaging"
import { TimerSettings } from "./TimerSettings"
import { formatTime, TimerState } from "./shared"
import { CountDownTimer } from "./CountDownTimer"

export function Timer({ id }: { id: number }) {
    let [timer, setTimer] = useTimer(id)
    let [hours, setHours] = useState(timer.hours)
    let [minutes, setMinutes] = useState(timer.minutes)
    let [seconds, setSeconds] = useState(timer.seconds)
    let [timerState, setTimerState] = useState<TimerState>("stopped")
    let [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

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

    subscribe("dialogClosed", () => setSettingsDialogOpen(false), [])

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
                    <button onClick={() => setSettingsDialogOpen(true)}>&#9881;</button>
                    <button onClick={() => publish("deleteTimer", id)}>❌</button>
                </div>

                {settingsDialogOpen && <TimerSettings id={id} />}

            </div>
        </>
    )
}
