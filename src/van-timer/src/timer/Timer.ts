import { timerStore, useTimer } from "../shared/data-store"
import { TimerSettings } from "./TimerSettings"
import { formatTime, TimerState } from "../shared/utils"
import { CountDownTimer } from "./CountDownTimer"
import van from "vanjs-core"
import type { DialogState } from "../components/Dialog"

let { button, div, fieldset, header, input, label } = van.tags
let { derive, state } = van

export function Timer(id: number) {
    let timer = useTimer(id)
    let hours = state(timer.val.hours)
    let minutes = state(timer.val.minutes)
    let seconds = state(timer.val.seconds)
    let timerState = state<TimerState>("stopped")
    let dialogState = state("closed" as DialogState)

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
        header({ class: "pb-0" },
            fieldset({ role: "group" },
                input({ id: `timerTitle${id}`, class: "plain", onchange: e => timer.val = { ...timer.val, title: e.target.value }, value: timer.val.title, name: "title", type: "text", placeholder: "Title" }),
                label({ for: `timerTitle${id}`, "aria-label": "Timer Title", innerHTML: "&#9998;" })
            )
        ),

        fieldset({ role: "group" },
            input({ onchange: setValue("hours"), value: () => formatTime(hours.val), name: "hours", type: "number", placeholder: "h" }),
            input({ onchange: setValue("minutes"), value: () => formatTime(minutes.val), name: "minutes", type: "number", placeholder: "m" }),
            input({ onchange: setValue("seconds"), value: () => formatTime(seconds.val), name: "seconds", type: "number", placeholder: "s" }),
        ),

        div({ class: "flex justify-between" },
            div({ class: "flex" },
                CountDownTimer(id, timer, timerState),
                button({
                    onclick: () => {timerState.val = "stopped"; setTimeout(() => timerState.val = "running", 1)},
                    hidden: () => timerState.val === "stopped",
                    innerHTML: "&#8635;" }),
                button({ onclick: () => dialogState.val = "opened", innerHTML: "&#9881;" }),
                button({ onclick: () => timerState.val = "deleting" }, "❌"),
            ),
            div(() => dialogState.val === "opened" ? TimerSettings(id, dialogState) : div())
        ),
    ]
}
