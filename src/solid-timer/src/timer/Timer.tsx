import { createEffect, createSignal, flush, Show } from "solid-js"
import { formatClock } from "../shared/alarm"
import { timerStore } from "../shared/data-store"
import type { TimerData } from "../shared/types"
import { formatTime, type TimerState } from "../shared/utils"
import { CountDownTimer } from "./CountDownTimer"
import { TimerSettings } from "./TimerSettings"

const limits = { hours: 23, minutes: 59, seconds: 59 }

export function Timer(props: { id: number, onDelete: () => void }) {
    // Writable memo seeded from the store; persisted on every change.
    const [timer, setTimer] = createSignal<TimerData>(() => timerStore.getTimer(props.id))
    const [timerState, setTimerState] = createSignal<TimerState>("stopped")
    const [startedAt, setStartedAt] = createSignal(0)
    const [settingsOpen, setSettingsOpen] = createSignal(false)
    const [editing, setEditing] = createSignal(false)
    let timeEntry!: HTMLFieldSetElement

    createEffect(timer, t => timerStore.updateTimer(t), { defer: true })

    function update(patch: Partial<TimerData>) {
        setTimer(t => ({ ...t, ...patch }))
    }

    function start() {
        setStartedAt(Date.now())
        setTimerState("running")
    }

    // The time inputs are uncontrolled: they're seeded once, and the change
    // handler validates, normalizes the displayed text and commits.
    function setValue(name: keyof typeof limits) {
        return (e: Event & { currentTarget: HTMLInputElement }) => {
            const input = e.currentTarget
            const value = +input.value
            if (!Number.isInteger(value) || value < 0 || value > limits[name]) {
                input.value = formatTime(timer()[name])
                return
            }
            input.value = formatTime(value)
            update({ [name]: value })
        }
    }

    // The time's inputs show while it's being edited, and while it's zero (as a
    // new timer's is), since there's nothing to show then. A running timer
    // keeps going; a new time is for its next start.
    const total = () => timer().hours * 3600 + timer().minutes * 60 + timer().seconds
    const showEntry = () => editing() || total() === 0

    function editTime() {
        setEditing(true)
        flush()
        timeEntry.querySelector("input")?.focus()
    }

    function leaveTimeEntry(e: FocusEvent & { currentTarget: HTMLFieldSetElement }) {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEditing(false)
    }

    return (
        <>
            <header class="timer-title">
                <label for={`timerTitle${props.id}`} aria-label="Timer Title">&#9998;</label>
                <input
                    id={`timerTitle${props.id}`}
                    class="plain"
                    onChange={e => update({ title: e.currentTarget.value })}
                    defaultValue={timer().title}
                    name="title"
                    type="text"
                    placeholder="Title" />
                <button class="plain" onClick={() => props.onDelete()} aria-label="Delete timer">❌</button>
            </header>

            <button class="plain time" onClick={editTime} title="Edit time" hidden={showEntry()}>
                <span aria-hidden="true">&#9998;</span> {formatClock(total())}
            </button>
            <fieldset ref={timeEntry} class="nc-join time-entry" hidden={!showEntry()}
                onFocusIn={() => setEditing(true)} onFocusOut={leaveTimeEntry}>
                <input onChange={setValue("hours")} defaultValue={formatTime(timer().hours)} name="hours" type="number" placeholder="h" />
                <input onChange={setValue("minutes")} defaultValue={formatTime(timer().minutes)} name="minutes" type="number" placeholder="m" />
                <input onChange={setValue("seconds")} defaultValue={formatTime(timer().seconds)} name="seconds" type="number" placeholder="s" />
            </fieldset>

            <div class="flex justify-between">
                <div class="flex">
                    <CountDownTimer
                        id={props.id}
                        sound={timer().sound}
                        state={timerState()}
                        startedAt={startedAt()}
                        onStart={start}
                        onStateChange={setTimerState} />
                    <button onClick={start} hidden={timerState() === "stopped"} aria-label="Restart">&#8635;</button>
                    <button onClick={() => setSettingsOpen(true)} aria-label="Timer options">&#9881;</button>
                </div>
                <Show when={settingsOpen()}>
                    <TimerSettings
                        sound={timer().sound}
                        onSoundChange={sound => update({ sound })}
                        onClose={() => setSettingsOpen(false)} />
                </Show>
            </div>
        </>
    )
}
