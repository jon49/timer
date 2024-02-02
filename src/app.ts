import * as vanX from "vanjs-ext"
import van, { State } from "vanjs-core"

const { div, input, button, span, br, label, select, option, dialog, h2, form, iframe } = van.tags

interface TimerInfo {
    sound: string
    timers: TimerData[]
}

interface TimerData {
    id: number
    hours: number
    minutes: number
    seconds: number
    title: string
    sound: string | null | undefined
}

type TimerState = "running" | "stopped" | "alarm"

const appStateKey = "timers"
let sound = "random"
let soundOptions = [
    ["random", "Random"],
    ["air-raid", "Air Raid", "QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],
    ["bell", "Bell", "475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],
    ["fire-truck", "Fire Truck", "5rpMLGS-eBs?si=P0A12rm0JRMw0gBP"],
    ["kyrie", "Kyrie eleison", "djkLm3WpUOE?si=De1srN8wGi3BTvlI"],
    ["song", "Song", "mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],
    ["tibetan", "Tibetan", "aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],
    ["warfare", "Warfare", "Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"],
]

function App() {
    let start = true
    let rawData = JSON.parse(localStorage.getItem(appStateKey) ?? `{"sound":"random","timers":[]}`)
    const data = <TimerInfo>vanX.reactive({ sound: rawData.sound || "random", timers: rawData.timers.filter((x: any) => x) })
    sound = data.sound
    let timers = data.timers
    van.derive(() => {
        if (start) {
            start = false
            return {
                sound: data.sound,
                timers: timers
                    .map(x => ({ ...x }))
            }
        }
        let json = JSON.stringify(data)
        console.log("saving")
        localStorage.setItem(appStateKey, json)
    })

    return [
    vanX.list(div, <any>timers, ({val: timer}: State<TimerData>) => {
        let { hours, minutes, seconds } = timer
        let secondsLeft = van.state(0)
        let state: State<TimerState> = van.state("stopped")
        return div(
            div(
                label(
                    input({
                        class: "plain",
                        type: "text",
                        value: timer.title || null,
                        placeholder: "Title",
                        onchange: (e: any) => timer.title = e.target.value
                    }),
                    span({ class: "editable-pencil", innerHTML: "&#9998;" })
                ),
            ),
            div(
                numberInputView(hours, "Hrs", (e: any) => timer.hours = +(e.target?.value || 0)),
                ":", numberInputView(minutes, "Min", (e: any) => timer.minutes = +(e.target?.value || 0)),
                ":", numberInputView(seconds, "Sec", (e: any) => timer.seconds = +(e.target?.value || 0)), " — ",
                clockView(timer, secondsLeft, state),
                button({
                    class: () => state.val === "stopped" ? "" : "hidden",
                    onclick: () => {
                        state.val = "running"
                        handleStartTimer(timer, secondsLeft, state)
                    }
                }, "Start"),
                button({onclick: () => {
                    state.val = "running"
                    handleStartTimer(timer, secondsLeft, state)
                }, innerHTML:  "&#8635;", class: () => state.val === "alarm" ? "" : "hidden"}),
                button({
                    innerHTML: "&#9881;",
                    onclick: showTimerOptions(timer) }),
                button({onclick: () => {
                    let index = timers.findIndex(x => x.id === timer.id)
                    if (index >= 0) {
                        timers.splice(index, 1)
                    }
                }
                }, "❌"),
        ))}),

        br(),

        div(button({onclick: () => timers.push({
            id: createId(timers),
            hours: 0,
            minutes: 0,
            seconds: 0,
            title: "",
            sound: null,
        })}, "Add Timer")),

        br(),

        div(label("Sound"), br(), select(
            { onchange: (e: any) => sound = data.sound = e.target.value },
            soundOptions.map(([value, label]) =>
                             option({ value, selected: value === sound }, label))
        ))
    ]
}

function numberInputView(value: number, placeholder: string, onchange: (value: Event) => void) {
    return input({
        class: "clock-input",
        type: "number",
        value: value || "",
        placeholder: placeholder,
        onchange,
    })
}

function clockView(timer: TimerData, secondsLeft: State<number>, state: State<TimerState>) {
    let clock = 
        span({
            class: () => 
                state.val === "alarm"
                    ? "pointer overlay"
                : "pointer",
            title: "Click to stop.",
            "aria-label": "Click to stop.",
            onclick: () => {
                state.val = "stopped"
                stopTimer(timer.id)
            }
        }, () => {
            let val = secondsLeft.val
            if (state.val === "running") {
                let hours = formatTime(Math.floor(val / 3600))
                let minutes = formatTime(Math.floor(val / 60) % 60)
                let seconds = formatTime(val % 60)
                return `${hours}:${minutes}:${seconds}`
            }
            return ""
        })

    return span({ class: "relative-container" },
        clock,
        span(() => {
                if (state.val === "alarm") {
                    return span(getAlarm(timer.sound ?? sound))
                } else {
                    return ""
                }
            }
        ),
    )
}

function showTimerOptions(timer: TimerData) {
    return () => {
        let xDialog = document.createElement("x-dialog")
        van.add(xDialog, dialog( { class: "modal" },
            div(
                h2({ class: "inline" }, "Options"),
                form({ class: "inline", method: "dialog" },
                    button({ value: "cancel" }, "Close"))
            ),
            label("Sound", br(),
                  select({ onchange: (e: any) => {
                      timer.sound = e.target.value
                  }},
                  option({ value: "default", selected: timer.sound == null }, "Default"),
                  soundOptions.map(([value, label]) => option({ value, selected: value === timer.sound }, label))
            ))
        ))
        document.body.appendChild(xDialog)
    }
}

let alarmIds = soundOptions.map(([value]) => value)
function getAlarm(sound: string) {
    if (sound === "random") return getAlarm(alarmIds[Math.floor(Math.random() * alarmIds.length)])
    let alarm = soundOptions.find(([name]) => name === sound)
    if (!alarm) return
    return iframe({
        width: "112",
        height: "63",
        style: "position:relative;top:23px;",
        src: `https://www.youtube.com/embed/${alarm[2]}&autoplay=1`,
        title: "Time up",
        frameborder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    })
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

let activeTimers: Record<string, { id: number, fn: (timeLeft: number) => void, startedAt: number, totalSeconds: number, timeoutId: number }> = {}
let interval: number | null = null
function startTimer(timer: TimerData, fn: (timeLeft: number) => void, timerStopped: (timerId: number) => void) {
    let totalSeconds = getTotalSeconds(timer)
    let startedAt = Date.now()/1e3
    activeTimers[timer.id] = {
        fn,
        startedAt,
        totalSeconds,
        id: timer.id,
        timeoutId: setTimeout(() => {
            stopTimer(timer.id)
            timerStopped(timer.id)
        }, totalSeconds * 1e3)
    }
    tick()
}

function tick() {
    if (interval) return
    interval = setInterval(() => {
        let now = Date.now()/1e3
        for (let timer of Object.values(activeTimers)) {
            let elapsed = now - timer.startedAt
            let timeLeft = Math.round(timer.totalSeconds - elapsed)
            timer.fn(timeLeft)
        }
    }, 1e3)
}

function stopTimer(timerId: number) {
    if (!activeTimers[timerId]) return
    clearTimeout(activeTimers[timerId].timeoutId)
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

function getTotalSeconds(timer: TimerData) {
    let { hours, minutes, seconds } = timer
    return hours * 3600 + minutes * 60 + seconds
}

function formatTime(num: number) {
    return num.toString().padStart(2, "0")
}

