import { timerStore, useTimer } from "../shared/data-store"
import { TimerSettings } from "./TimerSettings"
import { formatTime, TimerState } from "../shared/utils"
import { CountDownTimer, formatClock } from "./CountDownTimer"
import van from "vanjs-core"
import type { DialogState } from "../components/Dialog"

let { button, div, fieldset, header, input, label, span } = van.tags
let { derive, state } = van

export function Timer(id: number) {
    let timer = useTimer(id)
    let hours = state(timer.val.hours)
    let minutes = state(timer.val.minutes)
    let seconds = state(timer.val.seconds)
    let timerState = state<TimerState>("stopped")
    let dialogState = state("closed" as DialogState)
    let editing = state(false)
    let timeLeft = state(0)

    // The time's inputs show while it's being edited, and while it's zero (as a
    // new timer's is), since there's nothing to show then. A running timer
    // keeps going; a new time is for its next start.
    let total = () => hours.val * 3600 + minutes.val * 60 + seconds.val
    let showEntry = () => editing.val || total() === 0

    let $timeEntry = fieldset({ class: "nc-join time-entry", hidden: () => !showEntry() },
        input({ onchange: setValue("hours"), value: () => formatTime(hours.val), name: "hours", type: "number", placeholder: "h" }),
        input({ onchange: setValue("minutes"), value: () => formatTime(minutes.val), name: "minutes", type: "number", placeholder: "m" }),
        input({ onchange: setValue("seconds"), value: () => formatTime(seconds.val), name: "seconds", type: "number", placeholder: "s" }),
    )
    $timeEntry.addEventListener("focusin", () => editing.val = true)
    $timeEntry.addEventListener("focusout", e => {
        if (!$timeEntry.contains(e.relatedTarget as Node | null)) editing.val = false
    })

    function editTime() {
        editing.val = true
        // Van redraws on a later tick; the inputs have to show now to take focus.
        $timeEntry.hidden = false
        $timeEntry.querySelector("input")?.focus()
    }

    derive(() => {
        if (timerState.val !== "deleting") return
        timerStore.deleteTimer(id)
        // @ts-expect-error
        setTimeout(() => window[`appTimer${id}`]?.remove(), 1)
    })

    function setValue(name: "hours" | "minutes" | "seconds") {
        return (e: Event) => {
            if (!(e.target instanceof HTMLInputElement)) return
            let value = +e.target.value
            switch (name) {
                case "hours":
                    if (value < 0 || value > 23) {
                        e.target.value = formatTime(hours.val)
                        return
                    }
                    hours.val = value
                    break
                case "minutes":
                    if (value < 0 || value > 59) {
                        e.target.value = formatTime(minutes.val)
                        return
                    }
                    minutes.val = value
                    break
                case "seconds":
                    if (value < 0 || value > 59) {
                        e.target.value = formatTime(seconds.val)
                        return
                    }
                    seconds.val = value
                    break
            }
            timer.val = {
                ...timer.val,
                [name]: value
            }
        }
    }

    return [
        header({ class: "timer-title" },
            label({ for: `timerTitle${id}`, "aria-label": "Timer Title", innerHTML: "&#9998;" }),
            input({ id: `timerTitle${id}`, class: "plain", onchange: e => timer.val = { ...timer.val, title: e.target.value }, value: timer.val.title, name: "title", type: "text", placeholder: "Title" }),
            button({ class: "plain", onclick: () => timerState.val = "deleting", ariaLabel: "Delete timer" }, "❌"),
        ),

        button({ class: "plain time", onclick: editTime, title: "Edit time", hidden: showEntry },
            span({ "aria-hidden": "true", innerHTML: "&#9998;" }), " ", () => formatClock(
                timerState.val === "running" ? timeLeft.val : timerState.val === "alarm" ? 0 : total())),
        $timeEntry,

        div({ class: "flex justify-between" },
            div({ class: "flex" },
                CountDownTimer(id, timer, timerState, timeLeft),
                button({
                    onclick: () => {timerState.val = "stopped"; setTimeout(() => timerState.val = "running", 1)},
                    hidden: () => timerState.val === "stopped",
                    ariaLabel: "Restart",
                    innerHTML: "&#8635;" }),
                button({ onclick: () => dialogState.val = "opened", ariaLabel: "Timer options", innerHTML: "&#9881;" }),
            ),
            () => dialogState.val === "opened" ? TimerSettings(id, dialogState) : "",
        ),
    ]
}
