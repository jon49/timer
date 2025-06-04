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
    ["explosion", "Explosion", "/media/Explosion+2.wav"],
    ["forest", "Forest", "/media/forest.wav"],
    ["hag_idle", "Hag Idle", "/media/hag_idle.wav"],
    ["monster_footsteps", "Monster Footsteps", "/media/Monster_Footsteps.wav"],
    ["night2", "Night", "/media/night2.wav"],
    ["rain_start", "Rain", "/media/rain_start.wav"],
    ["sea", "Sea", "/media/sea.wav"],
    ["swamp1", "Swamp", "/media/swamp1.wav"],
    ["thunderrumble", "Thunder Rumble", "/media/thunderrumble.wav"],
    ["waves", "Waves", "/media/waves.wav"],
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

        let appDom = createTemplate(`<section x=timers class="grid timer-cards"></section>`).content

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
        document.addEventListener("click", this)
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
<x-modal>
    <dialog>
        <article id=app-settings-edit box>
            <header>
                <button form=modalClose aria-label=Close value=cancel rel=prev></button>
                <h2 class=inline>Options for All Timers</h2>
            </header>
            <h3>Allowed Sounds</h3>
            <form data-action=saveAllowedSounds>
            ${soundOptions.slice(1).map(([value, text]) => `
                <label>
                    <input type=checkbox value="${value}" ${this.data.allowedSounds.includes(value) ? "checked" : ""}>
                    ${text}
                </label>
            `).join("")}
            </form>
            <h3><label class for=sound-all>Specific Sound</label></h3>
            <select id=sound-all class="w-auto m-0" data-action=saveOption name=sound>
                ${soundOptions.map(([value, text]) => `
                <option value="${value}" ${value === this.data.sound ? "selected" : ""}>${text}</option>`).join("")}
            </select>
        </article>
        <form id=modalClose class=inline method=dialog></form>
    </dialog>
</x-modal>`
        dialogs.innerHTML = $options
        getElementById("app-settings-edit")?.addEventListener("change", this)
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
            requestAnimationFrame(function () {
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
        if (!(target instanceof HTMLInputElement || target instanceof HTMLLabelElement)) {
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
    timeEntry: HTMLFieldSetElement
    hours: HTMLInputElement
    minutes: HTMLInputElement
    seconds: HTMLInputElement
    toggleEl: HTMLButtonElement
    restartEl: HTMLButtonElement
    settingsEl: HTMLButtonElement
    deleteEl: HTMLButtonElement
    countdownEl: HTMLButtonElement
    audioEl: HTMLAudioElement
}

const timerTemplate = createTemplate(/*html*/`
<article>
<header>
    <label>
        <input x=title data-action=save class="plain w-auto" name=title type=text placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</header>
<div class="flex justify-between">

    <div class="inline reverse">
        <button
            id=countdownEl
            x=countdownEl
            data-action=stopClock
            hidden
            style="width: 140px;
            title="Click to stop."
            aria-label="Click to stop."></button>

        <fieldset x=timeEntry class="time-entry m-0" role="group">
            <!-- Timer input -->
            <input
                class="plain clock" data-action=save name=hours type=number x=hours placeholder=h
            ><input
                class="plain clock" data-action=save name=minutes type=number x=minutes placeholder=m
            ><input
                class="plain clock" data-action=save name=seconds type=number x=seconds placeholder=s>
        </fieldset>
    </div>

    <span hidden>
        <audio x=audioEl loop></audio>
    </span>

    <div class="flex">
        <button x=toggleEl data-action=toggleClock>Start</button>
        <button x=restartEl data-action=restartClock>&#8635;</button>
        <button x=settingsEl data-action=editSettings>&#9881;</button>
        <button x=deleteEl data-action=deleteTimer>❌</button>
    </div>

</div>
</article>
`)


class Timer extends HTMLElement {
    cache: Map<string, HTMLElement>
    timer: TimerData
    info: TimerInfo
    startedAt: number | null
    totalTime: number | null
    timeoutId: number | undefined
    alarmTimeoutId: number | undefined | null
    node: TimerTemplate
    state: "stopped" | "started" | "alarming" = "stopped"
    audioFadeIn: number | undefined

    constructor(timer: TimerData, timerInfo: TimerInfo) {
        super()

        this.cache = new Map()
        this.timer = timer
        this.info = timerInfo
        let template = timerTemplate.content.cloneNode(true) as DocumentFragment;
        let node = this.node = getXElements(template) as TimerTemplate

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

    toggleClock() {
        if (this.state === "stopped") {
            this.startClock()
        } else {
            this.stopClock()
        }
    }

    stopClock() {
        // Set defaults when in "stopped" state
        clearInterval(this.audioFadeIn)
        if (this.alarmTimeoutId) clearTimeout(this.alarmTimeoutId)
        this.alarmTimeoutId = null
        this.node.toggleEl.textContent = "Start"
        show(this.node.toggleEl)
        hide(this.node.restartEl)
        this.node.audioEl.pause()
        this.clearClock()
        this.state = "stopped"
    }

    startClock() {
        // Set defaults when in "started" state
        this.node.toggleEl.textContent = "Stop"
        hide(this.node.toggleEl)
        show(this.node.restartEl)
        this.setClock()
        // Start timer
        this.sendNotification("clockStarted")

        this.timeoutId = setTimeout(() => {
            this.sendNotification("timerExpired")
        }, this.getTotalSeconds() * 1e3)
        this.state = "started"
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
        show(this.node.toggleEl)

        let soundInfo = getAlarm(this.timer.sound || this.info.sound, this.info.allowedSounds)

        if (!soundInfo) {
            this.stopClock()
            return
        }

        if (this.alarmTimeoutId) clearTimeout(this.alarmTimeoutId)

        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
        this.state = "alarming"

        this.node.toggleEl.title = `Click to stop "${soundInfo.title}".`

        let audio = this.node.audioEl
        audio.src = soundInfo.url
        if (audio) {
            let volume = 1
            audio.volume = volume / 100
            this.audioFadeIn = setInterval(() => {
                if (volume < 100 && audio) {
                    volume += 1
                    audio.volume = volume / 100
                } else {
                    clearInterval(this.audioFadeIn)
                }
            }, 1200)

            audio.play()
                // Stop alarm after 1 minute.
                .then(_ => { this.alarmTimeoutId = setTimeout(() => this.stopClock(), 120e3) })
                .catch(x => console.error("Audio failed to start.", x))
        }
    }

    clearClock() {
        this.startedAt = null
        this.node.countdownEl.textContent = ""
        this.node.countdownEl.hidden = true
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
<x-modal>
    <dialog>
    <article box>
        <header>
            <button form=modalClose aria-label=Close value=cancel rel=prev></button>
            <h2 class=inline>Options</h2>
        </header>
        <label>
            Sound <br>
            <select id=option-dialog data-action=save name=sound>
                <option value=default ${this.timer.sound == null ? "selected" : ""}>Default</option>
                ${soundOptions.map(([value, text]) => `
                    <option value="${value}" ${value === this.timer.sound ? "selected" : ""}>${text}</option>
                `).join("")}
            </select>
        </label>
    </article>
    <form id=modalClose method=dialog></form>
    </dialog>
</x-modal>`
        dialogs.innerHTML = $options
        getElementById("option-dialog")?.addEventListener("change", this)
    }

    setClock(totalSeconds: number | null = null) {
        totalSeconds ??= this.getTotalSeconds()
        let hours = formatTime(Math.floor(totalSeconds / 3600))
        let minutes = formatTime(Math.floor(totalSeconds / 60) % 60)
        let seconds = formatTime(totalSeconds % 60)
        this.node.countdownEl.textContent = `${hours}:${minutes}:${seconds}`
        this.node.countdownEl.hidden = false
    }

    getTotalSeconds() {
        return this.timer.hours * 3600 + this.timer.minutes * 60 + +this.timer.seconds
    }

    tick(): boolean {
        if (this.state !== "started") {
            return false
        }
        if (this.startedAt == null) {
            this.startedAt = Date.now() / 1e3
            this.totalTime = this.getTotalSeconds()
        }
        let now = Date.now() / 1e3
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
function getAlarm(sound: string, allowedSounds: string[]): { url: string, title: string } | undefined {
    if (sound === "random") {
        let allowedAlarms = alarmIds.filter(x => allowedSounds.length === 0 || allowedSounds.includes(x))
        return getAlarm(allowedAlarms[Math.floor(Math.random() * allowedAlarms.length)], allowedSounds)
    }
    let alarm = soundOptions.find(([name]) => name === sound)
    if (!alarm) return
    return { url: alarm[2], title: alarm[1] }
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
    // event.preventDefault()
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

export { }
