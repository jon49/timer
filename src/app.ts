import * as vanX from "vanjs-ext"
import van, { State } from "vanjs-core"

const { div, input, button, span, html } = van.tags

interface TimerData {
    id: number
    hours: number
    minutes: number
    seconds: number
    notes: string
}

const appStateKey = "appState"

type TimerState = "running" | "stopped" | "alarm"

function App() {
    const items =
        <TimerData[]>vanX.reactive(
            JSON.parse(localStorage.getItem(appStateKey) ?? "[]")
            .filter((x: any) => x))
    van.derive(() => {
        let json = JSON.stringify(items.filter(x => x))
        console.log("saving", json)
        localStorage.setItem(appStateKey, json)
    })

    return [
    vanX.list(div, <any>items, ({val: v}: State<TimerData>) => {
        let { hours, minutes, seconds } = v
        let secondsLeft = van.state(0)
        let state: State<TimerState> = van.state("stopped")
        return div(
            input({
                type: "number",
                value: hours || "",
                placeholder: "Hrs", size: 3,
                onchange: (e: any) => v.hours = +(e.target?.value || 0)}),
            ":", input({
                    type: "number",
                    value: minutes || "",
                    placeholder: "Min", size: 3,
                    onchange: (e: any) => v.minutes = +(e.target?.value || 0)}),
            ":", input({
                type: "number",
                value: seconds || "",
                placeholder: "Sec", size: 3,
                onchange: (e: any) => v.seconds = +(e.target?.value || 0)}), " — ",
            span(userFeedbackView(secondsLeft, state)),
            button({onclick: () => {
                switch (state.val) {
                    case "running":
                        state.val = "stopped"
                        stopTimer(v.id)
                        break
                    case "stopped":
                        state.val = "running"
                        handleStartTimer(v, secondsLeft, state)
                        break
                    case "alarm":
                        state.val = "stopped"
                        break
                }
            }}, () => state.val === "stopped" ? "Start" : "Stop"),
            button({onclick: () => {
                state.val = "running"
                handleStartTimer(v, secondsLeft, state)
            }, innerHTML:  "&#8635;", class: () => state.val === "alarm" ? "" : "hidden"}),
            button({onclick: () => {
                let index = items.findIndex(x => x.id === v.id)
                if (index >= 0) {
                    items.splice(index, 1)
                }
            }
            }, "❌"),
        )}),

        div(button({onclick: () => items.push({
            id: createId(items),
            hours: 0,
            minutes: 0,
            seconds: 0,
            notes: "",
        })}, "Add Timer")),
    ]
}

function createId(items: TimerData[]) {
    let result = Math.max(...items.map(x => x.id), 0) + 1
    return result
}

let timerEl = document.getElementById("timer")
if (!timerEl) {
    console.error("No timer element found")
} else {
    van.add(timerEl, App())
}

let activeTimers: Record<string, { id: number, fn: (timeLeft: number) => void, startedAt: number, totalSeconds: number }> = {}
let interval: number | null = null
function startTimer(timer: TimerData, fn: (timeLeft: number) => void, timerStopped: (timerId: number) => void) {
    let totalSeconds = getTotalSeconds(timer)
    let startedAt = Date.now()/1e3
    activeTimers[timer.id] = { fn, startedAt, totalSeconds, id: timer.id }
    setTimeout(() => {
        stopTimer(timer.id)
        timerStopped(timer.id)
    }, totalSeconds * 1e3)
    tick()
}

function tick() {
    if (interval) return
    interval = setInterval(() => {
        let now = Date.now()/1e3
        for (let timer of Object.values(activeTimers)) {
            let elapsed = now - timer.startedAt
            let timeLeft = timer.totalSeconds - elapsed
            timer.fn(timeLeft)
        }
    }, 1e3)
}

function stopTimer(timerId: number) {
    delete activeTimers[timerId]
    if (Object.keys(activeTimers).length === 0 && interval) {
        clearInterval(interval)
        interval = null
    }
}

function handleStartTimer(timer: TimerData, secondsLeft: State<number>, timerState: State<TimerState>) {
    secondsLeft.val = getTotalSeconds(timer)
    startTimer(timer, timeLeft => secondsLeft.val = timeLeft, (timerId) => {
        timerState.val = "alarm"
        stopTimer(timerId)
    })
}

function userFeedbackView(secondsLeft: State<number>, state: State<TimerState>) {
    return () => {
        let val = secondsLeft.val | 0

        switch (state.val) {
            case "alarm":
                let bell = document.getElementById("bell")
                if (!(bell instanceof HTMLTemplateElement)) return "ALARM"
                let bellClone = bell.content.cloneNode(true)
                return span(bellClone)
            case "stopped":
                return ""
            case "running":
                let hours = formatTime(Math.floor(val / 3600))
                let minutes = formatTime(Math.floor(val / 60) % 60)
                let seconds = formatTime(val % 60)
                return `${hours}:${minutes}:${seconds}`
        }
    }
}

function getTotalSeconds(timer: TimerData) {
    let { hours, minutes, seconds } = timer
    return hours * 3600 + minutes * 60 + seconds
}

function formatTime(num: number) {
    return num.toString().padStart(2, "0")
}

