import { useState } from "react"
import { useTimer } from "../shared/data-store"
import { publish } from "../shared/messaging"

function formatTime(time: number) {
    if (!time) return ""
    return (""+time).padStart(2, "0")
}

export function Timer({id}: {id: number}) {
    let [timer, setTimer] = useTimer(id)
    let [hours, setHours] = useState(timer.hours)
    let [minutes, setMinutes] = useState(timer.minutes)
    let [seconds, setSeconds] = useState(timer.seconds)

    let hourDisplay = () => formatTime(hours)
    let minuteDisplay = () => formatTime(minutes)
    let secondDisplay = () => formatTime(seconds)

    function setValue(name: "hours" | "minutes" | "seconds") {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            timer[name] = +e.target.value
            switch(name) {
                case "hours": setHours(timer.hours); break
                case "minutes": setMinutes(timer.minutes); break
                case "seconds": setSeconds(timer.seconds); break
            }
            setTimer(timer)
        }
    }

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
                    <button
                        id="countdownEl"
                        data-action="stopClock"
                        hidden
                        style={{ width: "140px" }}
                        title="Click to stop."
                        aria-label="Click to stop."></button>

                    <fieldset className="time-entry m-0" role="group">
                        <input className="plain clock" onChange={setValue("hours")} value={hourDisplay()} name="hours" type="number" placeholder="h" />
                        <input className="plain clock" onChange={setValue("minutes")} value={minuteDisplay()} name="minutes" type="number" placeholder="m" />
                        <input className="plain clock" onChange={setValue("seconds")} value={secondDisplay()} name="seconds" type="number" placeholder="s" />
                    </fieldset>
                </div>

                <span hidden>
                    {/* x=audioEl */}
                    <audio loop></audio>
                </span>

                <div className="flex">
                    {/* x=toggleEl */}
                    <button data-action="toggleClock">Start</button>
                    {/* x=restartEl */}
                    <button data-action="restartClock">&#8635;</button>
                    {/* x=settingsEl */}
                    <button data-action="editSettings">&#9881;</button>
                    {/* x=deleteEl */}
                    <button onClick={() => publish("deleteTimer", id)}>❌</button>
                </div>

            </div>
        </>
    )
}
