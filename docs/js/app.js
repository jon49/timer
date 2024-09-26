// @ts-check
import html from './html.js'

// Custom element implementation.

/**
 * @typedef {Object} TimerInfo
 * @property {string} sound
 * @property {string[]} allowedSounds
 * @property {TimerData[]} timers
*/

/**
 * @typedef {Object} TimerData
 * @property {number} id
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 * @property {string} title
 * @property {string | null} sound
*/

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

class App extends HTMLElement {
    constructor() {
        super()
        /** @type {Timer[]} */
        this.activeTimers = []
        /** @type {TimerInfo} */
        this.data = JSON.parse(localStorage.getItem(appStateKey) ?? '{"sound":"random","timers":[]}')
        this.timers = this.data.timers.map(timer => new Timer(timer, this.data))
        this.innerHTML = "<div id=timers></div>"
        this.$timers = this.querySelector("#timers")
        this.$timers?.append(...this.timers)
        this.insertAdjacentHTML('beforeend', html`
<br>
<div>
<button data-action=addTimer>Add Timer</button>
</div>
<br>
<div>
<label>Sound</label>
<br>
<select data-action=saveOption name=sound>
    $${soundOptions.map(([value, text]) => html`
        <option value="${value}" ${value === this.data.sound ? "selected" : ""}>${text}</option>
    `).join("")}
</select>

    <button data-action=editSettings>&#9881;</button>
</div>`)

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

    /** @param {Event} event */
    handleEvent(event) {
        event.stopPropagation()
        event.preventDefault()
        let target = event.target
        if (target instanceof HTMLElement) {
            // @ts-ignore
            let action = target.dataset.action || target.closest('[data-action]')?.dataset?.action
            if (action) {
                if (this[action] instanceof Function) {
                    this[action](event)
                } else {
                    console.error(`Action ${action} not implemented.`)
                }
            } else if (this[event.type] instanceof Function) {
                this[event.type](event)
            }
        }
    }

    addTimer() {
        /** @type {TimerData} */
        let timer = {
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

    /** @param {Event} event */
    clockStarted(event) {
        let target = event.target
        if (!(target instanceof Timer)) return

        this.activeTimers.push(target)
        this.tick()
    }

    /** @param {Event} event */
    clockStopped(event) {
        let target = event.target
        if (!(target instanceof Timer)) return

        this.activeTimers = this.activeTimers.filter(x => x !== event.target)
        if (this.interval && this.activeTimers.length === 0) {
            clearInterval(this.interval)
            this.interval = null
        }
    }

    editSettings() {
        let dialogs = document.getElementById("dialogs")
        if (!dialogs) {
            console.error("Dialogs container not found.")
            return
        }

        if (this.data.allowedSounds.length === 0) {
            this.data.allowedSounds.push(...soundOptions.slice(1).map(([value]) => value))
        }

        let $options = html`
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
        $${soundOptions.slice(1).map(([value, text]) => html`
        <div>
            <label>
                <input type=checkbox value="${value}" $${this.data.allowedSounds.includes(value) ? "checked" : ""}>
                ${text}
            </label>
        </div>
        `).join("")}
        </form>
    </dialog>
</x-dialog>`
        dialogs.innerHTML = $options
        document.getElementById("allowed-sounds")?.addEventListener("change", this)
    }

    /** @param {Event} event */
    timerUpdated(event) {
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

    /** @param {Event} event */
    timerDeleted(event) {
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

    /** @param {Event} event */
    saveAllowedSounds(event) {
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

    /** @param {Event} event */
    saveOption(event) {
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

class Timer extends HTMLElement {

    /**
     * @param {TimerData} timer
     * @param {TimerInfo} timerInfo
     * */
    constructor(timer, timerInfo) {
        super()

        /** @type {Map<string, HTMLElement>} */
        this.cache = new Map()

        /** @type {TimerData} */
        this.timer = timer
        /** @type {TimerInfo} */
        this.info = timerInfo

        this.innerHTML = html`
<div>
<div>
    <label>
        <input data-action=save name=title class=plain type=text value="${timer.title || ''}" placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</div>
<div>
    <!-- Timer input -->
    <input data-action=save class=clock-input name=hours   type=number value=${timer.hours || ""}   placeholder=Hrs>
  : <input data-action=save class=clock-input name=minutes type=number value=${timer.minutes || ""} placeholder=Min>
  : <input data-action=save class=clock-input name=seconds type=number value=${timer.seconds || ""} placeholder=Sec>

    <!-- Clock display -->
    <span class=relative-container>
        <button
            data-action=stopClock
            class=naked
            title="Click to stop."
            aria-label="Click to stop."></button>
        <span data-id=alarm></span>
    </span>

    <button data-action=startClock>Start</button>
    <button data-action=restartClock>&#8635;</button>
    <button data-action=editSettings>&#9881;</button>
    <button data-action=deleteTimer>❌</button>

</div>
</div>`

        this.addEventListener("click", this)
        this.addEventListener("change", this)
        this.stopClock()
    }

    /** @param {Event} event */
    handleEvent(event) {
        event.stopPropagation()
        let target = event.target
        if (target instanceof HTMLElement) {
            let action = target.dataset.action
            if (action) {
                if (this[action] instanceof Function) {
                    this[action](event)
                } else {
                    console.error(`Action ${action} not implemented.`)
                }
            }
        }
    }

    /** @param {Event} event */
    save(event) {
        let target = event.target
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
            return
        }

        let timer = this.timer
        switch (target.name) {
            case "hours":
            case "minutes":
            case "seconds":
                timer[target.name] = +target.value
                break
            case "title":
                timer.title = target.value
                break
            case "sound":
                timer.sound = target.value
                break
        }
        this.sendNotification("timerUpdated")
    }

    stopClock() {
        // Set defaults when in "stopped" state
        this.$stopButton.classList.remove('overlay')
        show(this.$startButton)
        hide(this.$restartButton)
        this.$alarm.textContent = ""
        this.clearClock()
    }

    startClock() {
        // Set defaults when in "started" state
        hide(this.$startButton)
        show(this.$restartButton)
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
        this.$clock.textContent = ""
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
        this.sendNotification("clockStopped")
    }

    startAlarm() {
        this.clearClock()
        let alarmClone = getAlarm(this.timer.sound || this.info.sound, this.info.allowedSounds)
        if (!alarmClone) return
        this.$alarm.innerHTML = alarmClone
        this.$stopButton.classList.add("overlay")
        clearTimeout(this.timeoutId)
        this.timeoutId = void 0
    }

    editSettings() {
        let dialogs = document.getElementById("dialogs")
        if (!dialogs) {
            console.error("Dialogs container not found.")
            return
        }
        let $options = html`
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
                <option value=default $${this.timer.sound == null ? "selected" : ""}>Default</option>
                $${soundOptions.map(([value, text]) => html`
                    <option value="${value}" ${value === this.timer.sound ? "selected" : ""}>${text}</option>
                `).join("")}
            </select>
        </label>
    </dialog>
</x-dialog>`
        dialogs.innerHTML = $options
        document.getElementById("option-dialog")?.addEventListener("change", this)
    }

    get $restartButton() {
        return getAction(this, "restartClock")
    }

    get $stopButton() {
        return getAction(this, "stopClock")
    }

    get $startButton() {
        return getAction(this, "startClock")
    }

    get $alarm() {
        return getById(this, "alarm")
    }

    get $clock() {
        return this.$stopButton
    }

    /**
    * @param {number} [totalSeconds]
    */
    setClock(totalSeconds) {
        totalSeconds ??= this.getTotalSeconds()
        let hours = formatTime(Math.floor(totalSeconds / 3600))
        let minutes = formatTime(Math.floor(totalSeconds / 60) % 60)
        let seconds = formatTime(totalSeconds % 60)
        this.$clock.textContent = `${hours}:${minutes}:${seconds}`
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

    /** @param {string} event */
    sendNotification(event) {
        this.dispatchEvent(new CustomEvent(event, { bubbles: true }))
    }

}

customElements.define("x-app", App)
customElements.define("x-timer", Timer)


let $timer = document.getElementById("timer")
$timer?.append(new App())

/** @param {HTMLElement} element */
function show(element) {
    element.style.display = ""
}

/** @param {HTMLElement} element */
function hide(element) {
    element.style.display = "none"
}

/**
* @param {number} num
*/
function formatTime(num) {
    return num.toString().padStart(2, "0")
}

let alarmIds = soundOptions.slice(1).map(([value]) => value)
/**
* @param {string} sound
* @param {string[]} allowedSounds
* @returns {string | undefined}
*/
function getAlarm(sound, allowedSounds) {
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

/**
 * @param {HTMLElement & { cache: Map<string, HTMLElement> }} el
 * @param {string} id
 * @returns {HTMLElement}
 * */
function getById(el, id) {
    if (el.cache.has(id)) {
        // @ts-ignore
        return el.cache.get(id)
    }
    let result = el.querySelector(`[data-id=${id}]`)
    if (!(result instanceof HTMLElement)) {
        throw new Error(`Element with id ${id} not found.`)
    }
    el.cache.set(id, result)
    return result
}

// /**
//  * @param {HTMLElement & { cache: Map<string, HTMLElement> }} el
//  * @param {string} name
//  * @returns {HTMLInputElement}
//  * */
// function getForm(el, name) {
//     if (el.cache.has(name)) {
//         // @ts-ignore
//         return el.cache.get(name)
//     }
//     let $input = el.querySelector(`[name=${name}]`)
//     if (!($input instanceof HTMLInputElement)) {
//         throw new Error(`Input with name ${name} not found.`)
//     }
//     el.cache.set(name, $input)
//     return $input
// }

/**
 * @param {HTMLElement & { cache: Map<string, HTMLElement> }} el
 * @param {string} action
 * @returns {HTMLElement}
 * */
function getAction(el, action) {
    if (el.cache.has(action)) {
        // @ts-ignore
        return el.cache.get(action)
    }
    let result = el.querySelector(`[data-action=${action}]`)
    if (!(result instanceof HTMLElement)) {
        throw new Error(`Action ${action} not found.`)
    }
    el.cache.set(action, result)
    return result
}


