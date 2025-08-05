import { useTimer } from "../shared/data-store"
import { publish, subscribe } from "../shared/messaging"
import { TimerSettings } from "./TimerSettings"
import { formatTime, TimerState } from "../shared/utils"
import { CountDownTimer } from "./CountDownTimer"
import van from "vanjs-core"

let { button, div, fieldset, header, input, label, span } = van.tags
let { state } = van

export function Timer(id: number) {
    let timer = useTimer(id)
    let hours = state(timer.val.hours)
    let minutes = state(timer.val.minutes)
    let seconds = state(timer.val.seconds)
    let timerState = state<TimerState>("stopped")
    let settingsDialogOpen = state(false)

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

    subscribe("clockStopped", (timerId: number) => {
        if (timerId !== id) return
        timerState.val = "stopped"
    }, id)

    subscribe("clockStarted", (timerId: number) => {
        if (timerId !== id) return
        timerState.val = "running"
    }, id)

    subscribe("dialogClosed", () => settingsDialogOpen.val = false, id)

    return [
        header({ class: "pb-0" },
            label(
                input({ class: "plain w-auto", onchange: e => timer.val = { ...timer.val, title: e.target.value }, value: timer.val.title, name: "title", type: "text", placeholder: "Title" }),
                span({ class: "editable-pencil", innerHTML: "&#9998;" })
            )
        ),
        div({ class: "flex justify-between" },
            div({ class: "flex" },
                fieldset({ class: "time-entry m-0", role: "group" },
                    input({ class: "plain clock", onchange: setValue("hours"), value: () => formatTime(hours.val), name: "hours", type: "number", placeholder: "h" }),
                    input({ class: "plain clock", onchange: setValue("minutes"), value: () => formatTime(minutes.val), name: "minutes", type: "number", placeholder: "m" }),
                    input({ class: "plain clock", onchange: setValue("seconds"), value: () => formatTime(seconds.val), name: "seconds", type: "number", placeholder: "s" }),
                ),
                CountDownTimer(id),
            ),

            div({ class: "flex" },
                button({
                    onclick: () => { timerState.val = "running"; publish("clockStarted", id) },
                    hidden: () => timerState.val !== "stopped" },
                    "Start"),
                button({
                    onclick: () => publish("clockRestarted", id),
                    hidden: () => timerState.val === "stopped",
                    innerHTML: "&#8635;" }),
                button({ onclick: () => settingsDialogOpen.val = true, innerHTML: "&#9881;" }),
                button({ onclick: () => publish("deleteTimer", id) }, "❌"),
            ),
            div({ ondialogClosing: () => settingsDialogOpen.val = false },
                () => settingsDialogOpen.val ? TimerSettings(id) : div(),
            )
        ),
    ]
}
