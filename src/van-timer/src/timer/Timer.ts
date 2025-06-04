import { useTimer } from "../shared/data-store"
import { publish, subscribe } from "../shared/messaging"
import { TimerSettings } from "./TimerSettings"
import { formatTime, TimerState } from "../shared/utils"
import { CountDownTimer } from "./CountDownTimer"
import van from "vanjs-core"

let { button, div, fieldset, header, input, label, span } = van.tags
let { state, derive } = van

export function Timer(id: number) {
    let timer = useTimer(id)
    let hours = state(timer.val.hours)
    let minutes = state(timer.val.minutes)
    let seconds = state(timer.val.seconds)
    let timerState = state<TimerState>("stopped")
    let settingsDialogOpen = state(false)

    let hourDisplay = derive(() => formatTime(hours.val))
    let minuteDisplay = derive(() => formatTime(minutes.val))
    let secondDisplay = derive(() => formatTime(seconds.val))

    function setValue(name: "hours" | "minutes" | "seconds") {
        return (e: Event) => {
            if (!(e.target instanceof HTMLInputElement)) return
            let value = +e.target.value
            switch (name) {
                case "hours": hours.val = value; break
                case "minutes": minutes.val = value; break
                case "seconds": seconds.val = value; break
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
            div({ class: "inline reverse" },

                CountDownTimer(id),

                fieldset({ class: "time-entry m-0", role: "group" },
                    input({ class: "plain clock", onchange: setValue("hours"), value: hourDisplay.val, name: "hours", type: "number", placeholder: "h" }),
                    input({ class: "plain clock", onchange: setValue("minutes"), value: minuteDisplay.val, name: "minutes", type: "number", placeholder: "m" }),
                    input({ class: "plain clock", onchange: setValue("seconds"), value: secondDisplay.val, name: "seconds", type: "number", placeholder: "s" }),
                ),
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
