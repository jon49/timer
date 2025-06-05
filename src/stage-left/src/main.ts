import html from './stage-left.js'

// Custom element implementation.

interface TimerInfo {
    sound: string
    allowedSounds: string[]
    timers: TimerData[]
}

interface TimerData {
    id: number
    hours: number
    minutes: number
    seconds: number
    title: string
    sound: string | null
}

const appStateKey = "timers"
let soundOptions = [
    ["random", "Random"],
    ["air-raid", "Air Raid", "QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],
    ["bell", "Bell", "475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],
    ["kyrie", "Kyrie eleison", "djkLm3WpUOE?si=De1srN8wGi3BTvlI"],
    ["song", "Song", "mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],
    ["tibetan", "Tibetan", "aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],
    ["warfare", "Warfare", "Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"],
]

interface AppTemplate {
    timers: HTMLDivElement
}

class App extends HTMLElement {

    activeTimers: Timer[]
    data: TimerInfo
    timers: Timer[]
    $timers: HTMLDivElement
    interval: number | null = null

    constructor() {
        super()
        this.activeTimers = []
        this.data = JSON.parse(localStorage.getItem(appStateKey) ?? '{"sound":"random","timers":[], "allowedSounds":[]}')
        if (this.data.allowedSounds == null) {
            this.data.allowedSounds = []
        }
        this.timers = this.data.timers.map(timer => new Timer(timer, this.data))

        let appDom = html<AppTemplate>`
<div>
<div #=timers></div>

<br>
<div>
<button data-action=addTimer>Add Timer</button>
</div>
<br>
<div>
<label>Sound</label>
<br>

<select data-action=saveOption name=sound>
    ${soundOptions.map(([value, text]) => `
        <option value="${value}" ${value === this.data.sound ? "selected" : ""}>${text}</option>
    `).join("")}
</select>

    <button data-action=editSettings>&#9881;</button>
</div>
</div>
`()

        this.$timers = (<any>appDom.getNodes(["timers"]) as Pick<AppTemplate, "timers">).timers
        this.$timers.append(...this.timers)

        this.append(appDom.root)

        for (let event of [
            "click",
            "change",
            "timerUpdated",
            "clockStarted",
            "clockStopped",
            "timerDeleted",
        ]) {
            this.addEventListener(event, this)
        }
    }

    handleEvent(event: Event) {
        event.stopPropagation()
        event.preventDefault()
        let target = event.target
        if (target instanceof HTMLElement) {
            // @ts-ignore
            let action = target.dataset.action || target.closest('[data-action]')?.dataset?.action
            if (action) {
                // @ts-ignore
                if (this[action] instanceof Function) {
                    // @ts-ignore
                    this[action](event)
                } else {
                    console.error(`Action ${action} not implemented.`)
                }
            // @ts-ignore
            } else if (this[event.type] instanceof Function) {
                // @ts-ignore
                this[event.type](event)
            }
        }
    }

    addTimer() {
        let timer: TimerData = {
            id: Date.now(),
            hours: 0,
            minutes: 0,
            seconds: 0,
            title: "",
            sound: null
        }
        this.data.timers.push(timer)
        let timerElement = new Timer(timer, this.data)
        this.timers.push(timerElement)
        this.$timers?.append(timerElement)
        this.save()
    }

    clockStarted(event: Event) {
        let target = event.target
        if (!(target instanceof Timer)) return

        this.activeTimers.push(target)
        this.tick()
    }

    clockStopped(event: Event) {
        let target = event.target
        if (!(target instanceof Timer)) return

        this.activeTimers = this.activeTimers.filter(x => x !== event.target)
        if (this.interval && this.activeTimers.length === 0) {
            clearInterval(this.interval)
            this.interval = null
        }
    }

    editSettings() {
        let dialogs = getElementById("dialogs")
        if (!dialogs) {
            console.error("Dialogs container not found.")
            return
        }

        if (this.data.allowedSounds.length === 0) {
            this.data.allowedSounds.push(...soundOptions.slice(1).map(([value]) => value))
        }

        let $options = `
<x-dialog>
    <dialog class=modal>
        <div>
            <h2 class=inline>Options</h2>
            <form class=inline method=dialog>
                <button value=Cancel>Close</button>
            </form>
        <div>
        <h3>Allowed Sounds</h3>
        <form id=allowed-sounds data-action=saveAllowedSounds>
        ${soundOptions.slice(1).map(([value, text]) => `
        <div>
            <label>
                <input type=checkbox value="${value}" ${this.data.allowedSounds.includes(value) ? "checked" : ""}>
                ${text}
            </label>
        </div>
        `).join("")}
        </form>
    </dialog>
</x-dialog>`
        dialogs.innerHTML = $options
        getElementById("allowed-sounds")?.addEventListener("change", this)
    }

    timerUpdated(event: Event) {
        let target = event.target
        if (!(target instanceof Timer)) {
            return
        }

        let timer = target.timer
        let index = this.data.timers.findIndex(x => x.id === timer.id)
        if (index === -1) {
            console.error("Timer not found.")
            return
        }
        this.data.timers[index] = timer
        this.save()
    }

    timerDeleted(event: Event) {
        let target = event.target
        if (!(target instanceof Timer)) return
        let id = target.timer.id
        target.remove()

        this.data.timers = this.data.timers.filter(x => x.id !== id)
        this.save()
    }

    tick() {
        if (this.interval) return
        this.interval = setInterval(() => {
            for (let timer of this.activeTimers) {
                timer.tick()
            }
        }, 1e3)
    }

    saveAllowedSounds(event: Event) {
        let target = event.target
        if (!(target instanceof HTMLInputElement)) {
            return
        }
        this.data.allowedSounds = []
        for (let option of target.form?.querySelectorAll("input[type=checkbox]") ?? []) {
            if (!(option instanceof HTMLInputElement)) continue
            if (option.checked) {
                this.data.allowedSounds.push(option.value)
            }
        }
        this.save()
    }

    saveOption(event: Event) {
        let target = event.target
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
            return
        }

        let data = this.data
        switch (target.name) {
            case "sound":
                data.sound = target.value
                break
        }
        this.save()
    }

    save() {
        localStorage.setItem(appStateKey, JSON.stringify(this.data))
    }

}

interface TimerTemplate {
    title: string
    hours: number | string
    minutes: number | string
    seconds: number | string
    stopEl: HTMLButtonElement
    startEl: HTMLButtonElement
    restartEl: HTMLButtonElement
    settingsEl: HTMLButtonElement
    deleteEl: HTMLButtonElement
    alarmEl: HTMLSpanElement
}

const timerTemplate = html<TimerTemplate>`
<div>
<div>
    <label>
        <input data-action=save name=title class=plain type=text #value=title placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</div>
<div>
    <!-- Timer input -->
    <input data-action=save class=clock-input name=hours type=number #value=hours placeholder=Hrs>:<input data-action=save class=clock-input name=minutes type=number #value=minutes placeholder=Min>:<input data-action=save class=clock-input name=seconds type=number #value=seconds placeholder=Sec>

    <!-- Clock display -->
    <span class=relative-container>
        <button
            #=stopEl
            data-action=stopClock
            class=naked
            title="Click to stop."
            aria-label="Click to stop."></button>
        <span #=alarmEl></span>
    </span>

    <button #=startEl data-action=startClock>Start</button>
    <button #=restartEl data-action=restartClock>&#8635;</button>
    <button #=settingsEl data-action=editSettings>&#9881;</button>
    <button #=deleteEl data-action=deleteTimer>❌</button>

</div>
</div>`


class Timer extends HTMLElement {

    cache: Map<string, HTMLElement>
    timer: TimerData
    info: TimerInfo
    startedAt: number | null = null
    totalTime: number | null = null
    timeoutId: number | undefined
    node: Pick<TimerTemplate, "startEl" | "restartEl" | "stopEl" | "settingsEl" | "deleteEl" | "alarmEl">
            & {clockEl: HTMLButtonElement}

    constructor(timer: TimerData, timerInfo: TimerInfo) {
        super()

        this.cache = new Map()
        this.timer = timer
        this.info = timerInfo
        let template = timerTemplate();
        this.node = <any>template.getNodes(["startEl", "restartEl", "stopEl", "settingsEl", "deleteEl", "alarmEl"])
        this.node.clockEl = this.node.stopEl
        // @ts-ignore
        window.test = this.template

        template.update(timer)
        this.appendChild(template.root)

        this.addEventListener("click", this)
        this.addEventListener("change", this)
        this.stopClock()
    }

    handleEvent(event: Event) {
        event.stopPropagation()
        let target = event.target
        if (target instanceof HTMLElement) {
            let action = target.dataset.action
            if (action) {
                // @ts-ignore
                if (this[action] instanceof Function) {
                    // @ts-ignore
                    this[action](event)
                } else {
                    console.error(`Action ${action} not implemented.`)
                }
            }
        }
    }

    save(event: Event) {
        let target = event.target
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
            return
        }

        let timer = this.timer
        let value = target.value
        switch (target.name) {
            case "hours":
            case "minutes":
            case "seconds":
                timer[target.name] = +value
                break
            case "title":
                timer.title = value
                break
            case "sound":
                timer.sound = value === "default" ? null : value
                break
        }
        this.sendNotification("timerUpdated")
    }

    stopClock() {
        // Set defaults when in "stopped" state
        this.node.stopEl.classList.remove('overlay')
        show(this.node.startEl)
        hide(this.node.restartEl)
        this.node.alarmEl.textContent = ""
        this.clearClock()
    }

    startClock() {
        // Set defaults when in "started" state
        hide(this.node.startEl)
        show(this.node.restartEl)
        this.setClock()
        // Start timer
        this.sendNotification("clockStarted")

        this.timeoutId = setTimeout(() => {
            this.sendNotification("timerExpired")
        }, this.getTotalSeconds() * 1e3)
    }

    restartClock() {
        this.stopClock()
        this.startClock()
    }

    deleteTimer() {
        this.sendNotification("timerDeleted")
    }

    clearClock() {
        this.startedAt = null
        this.node.clockEl.textContent = ""
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
        this.sendNotification("clockStopped")
    }

    startAlarm() {
        this.clearClock()
        let alarmClone = getAlarm(this.timer.sound || this.info.sound, this.info.allowedSounds)
        if (!alarmClone) {
            this.stopClock()
            return
        }
        this.node.alarmEl.innerHTML = alarmClone
        this.node.stopEl.classList.add("overlay")
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
    }

    editSettings() {
        let dialogs = getElementById("dialogs")
        if (!dialogs) {
            console.error("Dialogs container not found.")
            return
        }
        let $options = `
<x-dialog>
    <dialog class=modal>
        <div>
            <h2 class=inline>Options</h2>
            <form class=inline method=dialog>
                <button value=Cancel>Close</button>
            </form>
        <div>
        <label>
            Sound <br>
            <select id=option-dialog data-action=save name=sound>
                <option value=default ${this.timer.sound == null ? "selected" : ""}>Default</option>
                ${soundOptions.map(([value, text]) => `
                    <option value="${value}" ${value === this.timer.sound ? "selected" : ""}>${text}</option>
                `).join("")}
            </select>
        </label>
    </dialog>
</x-dialog>`
        dialogs.innerHTML = $options
        getElementById("option-dialog")?.addEventListener("change", this)
    }

    setClock(totalSeconds: number | null = null) {
        totalSeconds ??= this.getTotalSeconds()
        let hours = formatTime(Math.floor(totalSeconds / 3600))
        let minutes = formatTime(Math.floor(totalSeconds / 60) % 60)
        let seconds = formatTime(totalSeconds % 60)
        this.node.clockEl.textContent = `${hours}:${minutes}:${seconds}`
    }

    getTotalSeconds() {
        return this.timer.hours * 3600 + this.timer.minutes * 60 + +this.timer.seconds
    }

    tick() {
        if (this.startedAt == null) {
            this.startedAt = Date.now()/1e3
            this.totalTime = this.getTotalSeconds()
        }
        let now = Date.now()/1e3
        let elapsed = now - this.startedAt
        let timeLeft = Math.round((this.totalTime ?? 0) - elapsed)
        if (timeLeft <= 0) {
            this.startAlarm()
            return
        }
        this.setClock(timeLeft)
    }

    sendNotification(event: string) {
        this.dispatchEvent(new CustomEvent(event, { bubbles: true }))
    }

}

customElements.define("x-app", App)
customElements.define("x-timer", Timer)


let $timer = getElementById("timer")
$timer?.append(new App())

function show(element: HTMLElement) {
    element.style.display = ""
}

function hide(element: HTMLElement) {
    element.style.display = "none"
}

function formatTime(num: number) {
    return num.toString().padStart(2, "0")
}

let alarmIds = soundOptions.slice(1).map(([value]) => value)
function getAlarm(sound: string, allowedSounds: string[]): string | undefined {
    if (sound === "random") {
        let allowedAlarms = alarmIds.filter(x => allowedSounds.length === 0 || allowedSounds.includes(x))
        return getAlarm(allowedAlarms[Math.floor(Math.random() * allowedAlarms.length)], allowedSounds)
    }
    let alarm = soundOptions.find(([name]) => name === sound)
    if (!alarm) return
    return `
    <iframe
        width=112
        height=63
        style="position:relative;top:23px;"
        src="https://www.youtube.com/embed/${alarm[2]}&autoplay=1"
        title="Time up"
        frameborder=0
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    ></iframe>`
}

function getElementById(id: string) {
    return document.getElementById(id)
}

