import { useEffect, useState } from "react"
import { timerStore } from "../shared/data-store"
import type { TimerData } from "../shared/types"
import { formatTime, type TimerState } from "../shared/utils"
import { CountDownTimer } from "./CountDownTimer"
import { TimerSettings } from "./TimerSettings"

let limits = { hours: 23, minutes: 59, seconds: 59 }

export function Timer({ id, onDelete }: { id: number, onDelete: () => void }) {
    let [timer, setTimer] = useState(() => timerStore.getTimer(id))
    let [timerState, setTimerState] = useState<TimerState>("stopped")
    let [startedAt, setStartedAt] = useState(0)
    let [settingsOpen, setSettingsOpen] = useState(false)

    useEffect(() => timerStore.updateTimer(timer), [timer])

    function update(patch: Partial<TimerData>) {
        setTimer(t => ({ ...t, ...patch }))
    }

    function start() {
        setStartedAt(Date.now())
        setTimerState("running")
    }

    // React's onChange fires on every keystroke; the timer commits on the
    // native change event (blur or Enter), like the other implementations.
    // The inputs are uncontrolled: the handler validates, normalizes the text
    // and commits.
    function onCommit(handler: (input: HTMLInputElement) => void) {
        return (input: HTMLInputElement | null) => {
            if (input) input.onchange = () => handler(input)
        }
    }

    function setValue(name: keyof typeof limits) {
        return onCommit(input => {
            let value = +input.value
            if (!Number.isInteger(value) || value < 0 || value > limits[name]) {
                input.value = formatTime(timerStore.getTimer(id)[name])
                return
            }
            input.value = formatTime(value)
            update({ [name]: value })
        })
    }

    return (
        <>
            <header className="pb-0">
                <fieldset role="group">
                    <input id={`timerTitle${id}`} className="plain" ref={onCommit(input => update({ title: input.value }))}
                        defaultValue={timer.title} name="title" type="text" placeholder="Title" />
                    <label htmlFor={`timerTitle${id}`} aria-label="Timer Title">&#9998;</label>
                </fieldset>
            </header>

            <fieldset role="group">
                <input ref={setValue("hours")} defaultValue={formatTime(timer.hours)} name="hours" type="number" placeholder="h" />
                <input ref={setValue("minutes")} defaultValue={formatTime(timer.minutes)} name="minutes" type="number" placeholder="m" />
                <input ref={setValue("seconds")} defaultValue={formatTime(timer.seconds)} name="seconds" type="number" placeholder="s" />
            </fieldset>

            <div className="flex justify-between">
                <div className="flex">
                    <CountDownTimer id={id} sound={timer.sound} state={timerState} startedAt={startedAt}
                        onStart={start} onStateChange={setTimerState} />
                    <button onClick={start} hidden={timerState === "stopped"} aria-label="Restart">&#8635;</button>
                    <button onClick={() => setSettingsOpen(true)} aria-label="Timer options">&#9881;</button>
                    <button onClick={onDelete} aria-label="Delete timer">❌</button>
                </div>
                {settingsOpen && (
                    <TimerSettings sound={timer.sound} onSoundChange={sound => update({ sound })}
                        onClose={() => setSettingsOpen(false)} />
                )}
            </div>
        </>
    )
}
