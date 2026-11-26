// Custom element implementation: <x-app> holds the timers, each one an
// <x-timer>. Elements named with an `x` attribute in a template are reached
// through a proxy: `$.name` reads or writes an input's value or an element's
// text, `$.$name` is the element. A `data-action` attribute names the method
// a click or change on that element calls.
import { formatClock, getAlarm, playAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { soundOptions } from "./shared/sounds"
import { tickCoordinator } from "./shared/tick-coordinator"
import { formatTime, type TimerState } from "./shared/utils"
import "./timer-navigation"

const elHandler: ProxyHandler<any> = {
    get(obj, prop: string) {
        if (prop[0] === "$") {
            return obj[prop.slice(1)]
        }
        let val = obj[prop]
        if (!(val instanceof HTMLElement)) return
        if (isInputElement(val)) {
            return val.value
        }
        return val.textContent
    },

    set(obj, prop: string, newVal) {
        let val = obj[prop]
        if (!(val instanceof HTMLElement)) return false
        if (isInputElement(val)) {
            val.value = newVal
            return true
        }
        // Rewrite the text node in place rather than replacing it.
        let text = val.firstChild
        if (text instanceof Text && !text.nextSibling) text.data = newVal
        else val.textContent = newVal
        return true
    }
}

let alarmSounds = soundOptions.slice(1)
let limits = { hours: 23, minutes: 59, seconds: 59 }

class App extends HTMLElement {

    $timers: HTMLElement

    constructor() {
        super()
        let appDom = html`<section x=timers class="grid timer-cards"></section>`.content
        this.$timers = (getXElements(appDom) as { $timers: HTMLElement }).$timers
        this.$timers.append(...timerStore.data.timers.map(timer => new Timer(timer.id)))
        this.append(appDom)

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
        let allowed = timerStore.data.allowedSounds
        let dialog = showDialog(`
<dialog>
    <article data-box>
        <header>
            <button form=modalClose aria-label=Close value=cancel rel=prev></button>
            <h2 class=inline>Options for All Timers</h2>
        </header>
        <h3>Allowed Sounds</h3>
        <form>
            <button type=button x=toggle data-action=toggleSounds></button>
            <hr>
            ${alarmSounds.map(([value, text]) => `
            <label>
                <input type=checkbox data-action=saveAllowedSounds value="${value}" ${allowed.includes(value) ? "checked" : ""}>
                ${text}
            </label>`).join("")}
        </form>
    </article>
    <form id=modalClose class=inline method=dialog></form>
</dialog>`, this)
        let $ = getXElements(dialog) as { toggle: string }
        let checkboxes = Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
        let show = () => {
            let allowed = timerStore.data.allowedSounds
            for (let box of checkboxes) box.checked = allowed.includes(box.value)
            $.toggle = allowed.length === alarmSounds.length ? "Deselect All" : "Select All"
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
    }
}

interface TimerTemplate {
    title: string
    $title: HTMLInputElement
    $titleLabel: HTMLLabelElement
    time: string
    $timeButton: HTMLButtonElement
    $timeEntry: HTMLFieldSetElement
    hours: string
    $hours: HTMLInputElement
    minutes: string
    seconds: string
    clock: string
    $clock: HTMLButtonElement
    $restart: HTMLButtonElement
}

const timerTemplate = html`
<article>
    <header class=timer-title>
        <label x=titleLabel aria-label="Timer Title">&#9998;</label>
        <input x=title data-action=saveTitle class=plain name=title type=text placeholder=Title>
        <button data-action=deleteTimer class=plain aria-label="Delete timer">❌</button>
    </header>
    <button x=timeButton data-action=editTime class="plain time" title="Edit time"
        ><span aria-hidden=true>&#9998;</span> <span x=time></span></button>
    <fieldset x=timeEntry class="nc-join time-entry">
        <input x=hours data-action=saveTime name=hours type=number placeholder=h>
        <input x=minutes data-action=saveTime name=minutes type=number placeholder=m>
        <input x=seconds data-action=saveTime name=seconds type=number placeholder=s>
    </fieldset>
    <div class="flex justify-between">
        <div class=flex>
            <button x=clock class=clock data-action=toggleClock style="width: 140px;"
                title="Click to stop." aria-label="Click to start.">Start</button>
            <button x=restart data-action=startClock hidden aria-label=Restart>&#8635;</button>
            <button data-action=editSettings aria-label="Timer options">&#9881;</button>
        </div>
    </div>
</article>`

class Timer extends HTMLElement {
    id_: number
    $: TimerTemplate
    state: TimerState = "stopped"
    editing = false
    startedAt = 0
    totalTime = 0
    timeoutId: number | undefined
    alarmTimeoutId: number | undefined
    stopAudio = () => { }

    constructor(id: number) {
        super()
        this.id_ = id
        let timer = timerStore.getTimer(id)
        let template = timerTemplate.content.cloneNode(true) as DocumentFragment
        let $ = this.$ = getXElements(template) as TimerTemplate
        $.$title.id = `timerTitle${id}`
        $.$titleLabel.htmlFor = $.$title.id
        $.title = timer.title
        for (let name of ["hours", "minutes", "seconds"] as const) $[name] = formatTime(timer[name])
        this.appendChild(template)
        this.addEventListener("click", this)
        this.addEventListener("change", this)
        $.$timeEntry.addEventListener("focusin", () => this.editing = true)
        $.$timeEntry.addEventListener("focusout", e => {
            if ($.$timeEntry.contains(e.relatedTarget as Node | null)) return
            this.editing = false
            this.showTime()
        })
        this.showTime()
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
        this.update({ title: this.$.title })
    }

    saveTime(event: Event) {
        let input = event.target as HTMLInputElement
        let name = input.name as keyof typeof limits
        let value = +input.value
        if (Number.isInteger(value) && value >= 0 && value <= limits[name]) {
            this.update({ [name]: value })
        }
        input.value = formatTime(this.timer[name])
        // A running timer keeps going; the new time is for its next start.
        this.showTime()
    }

    // The time's inputs show while it's being edited, and while it's zero (as a
    // new timer's is), since there's nothing to show then.
    showTime() {
        let $ = this.$
        let total = timerStore.getTotalTime(this.id_)
        let entry = this.editing || total === 0
        $.time = formatClock(total)
        $.$timeButton.hidden = entry
        $.$timeEntry.hidden = !entry
    }

    editTime() {
        this.editing = true
        this.showTime()
        this.$.$hours.focus()
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
        let $ = this.$
        this.state = "running"
        this.startedAt = Math.floor(Date.now() / 1e3)
        this.totalTime = timerStore.getTotalTime(this.id_)
        $.clock = formatClock(this.totalTime)
        $.$clock.ariaLabel = "Click to stop."
        $.$restart.hidden = false
        tickCoordinator.subscribe(this.id_, now => $.clock = formatClock(this.totalTime - (now - this.startedAt)))
        this.timeoutId = setTimeout(() => this.startAlarm(), this.totalTime * 1e3)
    }

    stopClock() {
        this.clearClock()
        let $ = this.$
        this.state = "stopped"
        $.clock = "Start"
        $.$clock.title = "Click to stop."
        $.$clock.ariaLabel = "Click to start."
        $.$restart.hidden = true
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
        let $ = this.$
        this.state = "alarm"
        $.clock = "Stop"
        $.$clock.ariaLabel = "Click to start."
        $.$clock.focus()
        let sound = getAlarm(this.timer.sound, timerStore.data.allowedSounds)
        if (!sound) return
        $.$clock.title = sound.title
        this.stopAudio = playAlarm(new Audio(), sound)
        // Stop the alarm after 2 minutes.
        this.alarmTimeoutId = setTimeout(() => this.stopClock(), 12e4)
    }

    deleteTimer() {
        this.clearClock()
        timerStore.deleteTimer(this.id_)
        this.remove()
    }

    editSettings() {
        let sound = this.timer.sound ?? "default"
        showDialog(`
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
                <input type=radio name=sound data-action=saveSound value="${value}" ${value === sound ? "checked" : ""}>
                ${text}
            </label>`).join("")}
        </fieldset>
    </article>
    <form id=modalClose method=dialog></form>
</dialog>`, this)
    }

    saveSound(event: Event) {
        let value = (event.target as HTMLInputElement).value
        this.update({ sound: value === "default" ? null : value })
    }
}

customElements.define("x-app", App)
customElements.define("x-timer", Timer)

document.getElementById("timer")?.append(new App())

// Shows `markup` (a <dialog>) as a modal, sending its clicks and changes to
// `owner`. Clicking the backdrop closes it; closing removes it.
function showDialog(markup: string, owner: HTMLElement) {
    let dialog = html([markup] as unknown as TemplateStringsArray).content.firstElementChild as HTMLDialogElement
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
    return dialog
}

function isInputElement(obj: HTMLElement) {
    return obj instanceof HTMLInputElement || obj instanceof HTMLSelectElement
}

function getXElements(fragment: ParentNode) {
    let o = {}
    for (let el of fragment.querySelectorAll(`[x]`)) {
        // @ts-ignore
        o[el.getAttribute('x') || ''] = el
        el.removeAttribute('x')
    }
    return new Proxy(o, elHandler)
}

function html(templateString: TemplateStringsArray) {
    let template = <HTMLTemplateElement>document.createElement('template')
    template.innerHTML = templateString[0]
    return template
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
