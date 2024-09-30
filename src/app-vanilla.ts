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

    data: TimerInfo
    timers: Timer[]
    $timers: HTMLDivElement
    interval: number | null

    constructor() {
        super()
        this.data = JSON.parse(localStorage.getItem(appStateKey) ?? '{"sound":"random","timers":[], "allowedSounds":[]}')
        if (this.data.allowedSounds == null) {
            this.data.allowedSounds = []
        }
        this.timers = this.data.timers.map(timer => new Timer(timer, this.data))

        let appDom = createTemplate(`
<div>
<div x=timers></div>

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
</div>`).content

        this.$timers = (getXElements(appDom) as AppTemplate).timers
        this.$timers.append(...this.timers)

        this.append(appDom)

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
        handleEvent(this, event)
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

        this.tick()
    }

    clockStopped(event: Event) {
        let target = event.target
        if (!(target instanceof Timer)) return
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
        let self = this
        this.interval = setInterval(() => {
            requestAnimationFrame(function() {
                let hasActiveTimer = false
                for (let timer of self.timers) {
                    let isActive = timer.tick()
                    hasActiveTimer = hasActiveTimer || isActive
                }
                if (!hasActiveTimer && self.interval) {
                    clearInterval(self.interval)
                    self.interval = null
                }
            })
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
    title: HTMLInputElement
    hours: HTMLInputElement
    minutes: HTMLInputElement
    seconds: HTMLInputElement
    stopEl: HTMLButtonElement
    startEl: HTMLButtonElement
    restartEl: HTMLButtonElement
    settingsEl: HTMLButtonElement
    deleteEl: HTMLButtonElement
    alarmEl: HTMLSpanElement
    clockSeperator: HTMLSpanElement
}

const timerTemplate = createTemplate(`
<div>
<div>
    <label>
        <input x=title data-action=save class=plain name=title type=text placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</div>
<div>
    <!-- Timer input -->
    <input
        class="plain clock" data-action=save name=hours type=number x=hours placeholder=h
    >:<input
        class="plain clock" data-action=save name=minutes type=number x=minutes placeholder=m
    >:<input
        class="plain clock" data-action=save name=seconds type=number x=seconds placeholder=s>

    <span x=clockSeperator>&#9876;</span>

    <!-- Clock display -->
    <span class=relative-container>
        <button
            x=stopEl
            data-action=stopClock
            class=naked
            title="Click to stop."
            aria-label="Click to stop."></button>
        <span x=alarmEl></span>
    </span>

    <button x=startEl data-action=startClock>Start</button>
    <button x=restartEl data-action=restartClock>&#8635;</button>
    <button x=settingsEl data-action=editSettings>&#9881;</button>
    <button x=deleteEl data-action=deleteTimer>❌</button>

</div>
</div>`)


class Timer extends HTMLElement {

    cache: Map<string, HTMLElement>
    timer: TimerData
    info: TimerInfo
    startedAt: number | null
    totalTime: number | null
    timeoutId: number | undefined
    node: TimerTemplate & {clockEl: HTMLButtonElement}
    state: "stopped" | "started" | "alarming" = "stopped"

    constructor(timer: TimerData, timerInfo: TimerInfo) {
        super()

        this.cache = new Map()
        this.timer = timer
        this.info = timerInfo
        let template = timerTemplate.content.cloneNode(true) as DocumentFragment;
        let node = getXElements(template) as TimerTemplate
        this.node = { ...node, clockEl: node.stopEl }

        setValue(node.title, timer.title)
        setValue(node.hours, timer.hours || "")
        setValue(node.minutes, timer.minutes || "")
        setValue(node.seconds, timer.seconds || "")

        this.appendChild(template)

        this.addEventListener("click", this)
        this.addEventListener("change", this)
        this.stopClock()
    }

    handleEvent(event: Event) {
        handleEvent(this, event)
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
        hide(this.node.clockSeperator)
        this.node.alarmEl.textContent = ""
        this.clearClock()
        this.state = "stopped"
    }

    startClock() {
        this.state = "started"
        // Set defaults when in "started" state
        hide(this.node.startEl)
        show(this.node.clockSeperator)
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

    startAlarm() {
        this.clearClock()
        hide(this.node.clockSeperator)
        let alarmClone = getAlarm(this.timer.sound || this.info.sound, this.info.allowedSounds)
        if (!alarmClone) {
            this.stopClock()
            return
        }
        this.node.alarmEl.innerHTML = alarmClone
        this.node.stopEl.classList.add("overlay")
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
        this.state = "alarming"
    }

    clearClock() {
        this.startedAt = null
        this.node.clockEl.textContent = ""
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
        this.sendNotification("clockStopped")
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

    tick(): boolean {
        if (this.state !== "started") {
            return false
        }
        if (this.startedAt == null) {
            this.startedAt = Date.now()/1e3
            this.totalTime = this.getTotalSeconds()
        }
        let now = Date.now()/1e3
        let elapsed = now - this.startedAt
        let timeLeft = Math.round((this.totalTime ?? 0) - elapsed)
        if (timeLeft <= 0) {
            this.startAlarm()
            return false
        }
        this.setClock(timeLeft)
        return true
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

function getXElements(fragment: DocumentFragment) {
    let o = {}
    for (let el of fragment.querySelectorAll(`[x]`)) {
        o[el.getAttribute('x') || ''] = el
        el.removeAttribute('x')
    }
    return o
}

function createTemplate(templateString: string) {
    let template = <HTMLTemplateElement>document.createElement('template')
    template.innerHTML = templateString;
    return template
}

function setValue(input: HTMLInputElement, value: string | number) {
    input.value = value.toString()
}

function handleEvent(context: HTMLElement, event: Event) {
    event.stopPropagation()
    event.preventDefault()
    let target = event.target
    if (target instanceof HTMLElement) {
        // @ts-ignore
        let action = target.dataset.action || target.closest('[data-action]')?.dataset?.action
        if (action) {
            if (context[action] instanceof Function) {
                context[action](event)
            } else {
                console.error(`Action ${action} not implemented.`)
            }
        } else if (context[event.type] instanceof Function) {
            context[event.type](event)
        }
    }
}

