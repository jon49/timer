// Custom elements rendered with stage-left templates: `#=name` marks a node
// to reach with getNodes(), and `#attr=key` (or `#text=key`) is set from
// `key` on update(). A `data-action` attribute names the method a click or
// change on that element calls.
import html from "./stage-left.js"
import { formatClock, getAlarm, playAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { soundOptions } from "./shared/sounds"
import { tickCoordinator } from "./shared/tick-coordinator"
import { formatTime, type TimerState } from "./shared/utils"
import "./timer-navigation"

let alarmSounds = soundOptions.slice(1)
let limits = { hours: 23, minutes: 59, seconds: 59 }

class App extends HTMLElement {

    $timers: HTMLElement

    constructor() {
        super()
        let template = appTemplate()
        this.$timers = (template.getNodes(["timers"]) as any).timers as HTMLElement
        this.$timers.append(...timerStore.data.timers.map(timer => new Timer(timer.id)))
        this.append(template.root)

        // The header lives outside <x-app>, so listen on the document.
        for (let event of ["click", "change"]) {
            document.addEventListener(event, this)
        }
    }

    handleEvent(event: Event) {
        handleEvent(this, event)
    }

    addTimer() {
        this.$timers.append(new Timer(timerStore.newTimer().id))
    }

    downloadData() {
        downloadData()
    }

    uploadData() {
        uploadData()
    }

    editSettings() {
        let template = allowedSoundsTemplate()
        let root = template.root as HTMLDialogElement
        let checkboxes = Array.from(root.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
        let show = () => {
            let allowed = timerStore.data.allowedSounds
            for (let box of checkboxes) box.checked = allowed.includes(box.value)
            template.update({ toggle: allowed.length === alarmSounds.length ? "Deselect All" : "Select All" })
        }
        show()
        Object.assign(this, {
            saveAllowedSounds() {
                timerStore.setAllowedSounds(checkboxes.filter(x => x.checked).map(x => x.value))
                show()
            },
            toggleSounds() {
                let all = timerStore.data.allowedSounds.length === alarmSounds.length
                timerStore.setAllowedSounds(all ? [] : alarmSounds.map(([value]) => value))
                show()
            },
        })
        showDialog(root, this)
    }
}

const appTemplate = html<{ timers: HTMLElement }>`<section #=timers class="grid timer-cards"></section>`

const allowedSoundsTemplate = html<{ toggle: string }>`
<dialog>
    <article data-box>
        <header>
            <button form=modalClose aria-label=Close value=cancel rel=prev></button>
            <h2 class=inline>Options for All Timers</h2>
        </header>
        <h3>Allowed Sounds</h3>
        <form>
            <button type=button #text=toggle data-action=toggleSounds></button>
            <hr>
            ${alarmSounds.map(([value, text]) => `
            <label>
                <input type=checkbox data-action=saveAllowedSounds value="${value}">
                ${text}
            </label>`).join("")}
        </form>
    </article>
    <form id=modalClose class=inline method=dialog></form>
</dialog>`

const timerSettingsTemplate = html`
<dialog>
    <article data-box>
        <header>
            <button form=modalClose aria-label=Close value=cancel rel=prev></button>
            <h2 class=inline>Options</h2>
        </header>
        <fieldset>
            <legend>Sound</legend>
            ${[["default", "Default"], ...soundOptions].map(([value, text]) => `
            <label>
                <input type=radio name=sound data-action=saveSound value="${value}">
                ${text}
            </label>`).join("")}
        </fieldset>
    </article>
    <form id=modalClose method=dialog></form>
</dialog>`

interface TimerTemplate {
    titleId: string
    title: string
    hours: string
    minutes: string
    seconds: string
    clock: string
    clockTitle: string
    clockLabel: string
    titleEl: HTMLInputElement
    hoursEl: HTMLInputElement
    minutesEl: HTMLInputElement
    secondsEl: HTMLInputElement
    clockEl: HTMLButtonElement
    restartEl: HTMLButtonElement
    audioEl: HTMLAudioElement
}

const timerTemplate = html<TimerTemplate>`
<article>
    <header class="pb-0">
        <fieldset role=group>
            <input #=titleEl #id=titleId #value=title data-action=saveTitle class=plain name=title type=text placeholder=Title>
            <label #for=titleId aria-label="Timer Title">&#9998;</label>
        </fieldset>
    </header>
    <fieldset role=group>
        <input #=hoursEl #value=hours data-action=saveTime name=hours type=number placeholder=h>
        <input #=minutesEl #value=minutes data-action=saveTime name=minutes type=number placeholder=m>
        <input #=secondsEl #value=seconds data-action=saveTime name=seconds type=number placeholder=s>
    </fieldset>
    <div class="flex justify-between">
        <div class=flex>
            <button #=clockEl #text=clock #title=clockTitle #aria-label=clockLabel data-action=toggleClock style="width: 140px;"></button>
            <span hidden><audio #=audioEl loop></audio></span>
            <button #=restartEl data-action=startClock aria-label=Restart>&#8635;</button>
            <button data-action=editSettings aria-label="Timer options">&#9881;</button>
            <button data-action=deleteTimer aria-label="Delete timer">❌</button>
        </div>
    </div>
</article>`

class Timer extends HTMLElement {
    id_: number
    template: ReturnType<typeof timerTemplate>
    node: Pick<TimerTemplate, "titleEl" | "clockEl" | "restartEl" | "audioEl">
    state: TimerState = "stopped"
    startedAt = 0
    totalTime = 0
    timeoutId: number | undefined
    alarmTimeoutId: number | undefined
    stopAudio = () => { }

    constructor(id: number) {
        super()
        this.id_ = id
        let timer = timerStore.getTimer(id)
        let template = this.template = timerTemplate({
            titleId: `timerTitle${id}`,
            title: timer.title,
            hours: formatTime(timer.hours),
            minutes: formatTime(timer.minutes),
            seconds: formatTime(timer.seconds),
        })
        this.node = template.getNodes(["titleEl", "clockEl", "restartEl", "audioEl"]) as any
        this.appendChild(template.root)
        this.addEventListener("click", this)
        this.addEventListener("change", this)
        this.showStopped()
    }

    handleEvent(event: Event) {
        handleEvent(this, event)
    }

    get timer() {
        return timerStore.getTimer(this.id_)
    }

    update(patch: Partial<ReturnType<typeof timerStore.getTimer>>) {
        timerStore.updateTimer({ ...this.timer, ...patch })
    }

    saveTitle() {
        this.update({ title: this.node.titleEl.value })
    }

    saveTime(event: Event) {
        let input = event.target as HTMLInputElement
        let name = input.name as keyof typeof limits
        let value = +input.value
        if (Number.isInteger(value) && value >= 0 && value <= limits[name]) {
            this.update({ [name]: value })
        }
        input.value = formatTime(this.timer[name])
    }

    toggleClock() {
        if (this.state === "stopped") {
            this.startClock()
        } else {
            this.stopClock()
        }
    }

    // Also restarts a running or ringing timer.
    startClock() {
        this.clearClock()
        this.state = "running"
        this.startedAt = Math.floor(Date.now() / 1e3)
        this.totalTime = timerStore.getTotalTime(this.id_)
        this.template.update({ clock: formatClock(this.totalTime), clockTitle: "Click to stop.", clockLabel: "Click to stop." })
        this.node.restartEl.hidden = false
        tickCoordinator.subscribe(this.id_, now =>
            this.template.update({ clock: formatClock(this.totalTime - (now - this.startedAt)) }))
        this.timeoutId = setTimeout(() => this.startAlarm(), this.totalTime * 1e3)
    }

    stopClock() {
        this.clearClock()
        this.showStopped()
    }

    showStopped() {
        this.state = "stopped"
        this.template.update({ clock: "Start", clockTitle: "Click to stop.", clockLabel: "Click to start." })
        this.node.restartEl.hidden = true
    }

    clearClock() {
        tickCoordinator.unsubscribe(this.id_)
        clearTimeout(this.timeoutId)
        clearTimeout(this.alarmTimeoutId)
        this.stopAudio()
        this.stopAudio = () => { }
    }

    startAlarm() {
        this.clearClock()
        this.state = "alarm"
        this.template.update({ clock: "Stop", clockLabel: "Click to start." })
        this.node.clockEl.focus()
        let sound = getAlarm(this.timer.sound, timerStore.data.allowedSounds)
        if (!sound) return
        this.template.update({ clockTitle: sound.title })
        this.stopAudio = playAlarm(this.node.audioEl, sound)
        // Stop the alarm after 2 minutes.
        this.alarmTimeoutId = setTimeout(() => this.stopClock(), 12e4)
    }

    deleteTimer() {
        this.clearClock()
        timerStore.deleteTimer(this.id_)
        this.remove()
    }

    editSettings() {
        let dialog = timerSettingsTemplate().root as HTMLDialogElement
        let sound = this.timer.sound ?? "default"
        for (let radio of dialog.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
            radio.checked = radio.value === sound
        }
        showDialog(dialog, this)
    }

    saveSound(event: Event) {
        let value = (event.target as HTMLInputElement).value
        this.update({ sound: value === "default" ? null : value })
    }
}

customElements.define("x-app", App)
customElements.define("x-timer", Timer)

document.getElementById("timer")?.append(new App())

// Shows a <dialog> as a modal, sending its clicks and changes to `owner`.
// Clicking the backdrop closes it; closing removes it.
function showDialog(dialog: HTMLDialogElement, owner: HTMLElement) {
    let handler = (event: Event) => handleEvent(owner, event)
    dialog.addEventListener("change", handler)
    dialog.addEventListener("click", event => {
        if (!(event.target as HTMLElement).closest("[data-box]")) {
            dialog.close()
        } else {
            handler(event)
        }
    })
    dialog.addEventListener("close", () => dialog.remove())
    document.body.append(dialog)
    dialog.showModal()
}

function handleEvent(context: HTMLElement, event: Event) {
    let target = event.target
    if (!(target instanceof HTMLElement)) return
    let action = target.dataset.action
    if (!action) return
    event.stopPropagation()
    // @ts-ignore
    if (context[action] instanceof Function) {
        // @ts-ignore
        context[action](event)
    } else {
        console.error(`Action ${action} not implemented.`)
    }
}
