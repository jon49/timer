// @ts-check

// Custom element implementation.

(() => {

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

/**
* @typedef {Object} TimerData
* @property {number} id
* @property {number} hours
* @property {number} minutes
* @property {number} seconds
* @property {string} title
* @property {string | null | undefined} sound
*/

/**
* @typedef {Object} TimerInfo
* @property {string} sound
* @property {string[]} allowedSounds
* @property {TimerData[]} timers
*/

class Timer extends HTMLElement {
    /** @type {"stopped" | "started"} */
    state = "stopped"
    /**
    * @param {TimerData} timer
    * @param {TimerInfo} info
    */
    constructor(timer, info) {
        super()
        this.allowedSounds = info.allowedSounds
        let { id, hours, minutes, seconds, title } = timer
        this.setAttribute("id", ""+id)
        this.hours = clockInputView(hours, "Hrs")
        this.minutes = clockInputView(minutes, "Min")
        this.seconds = clockInputView(seconds, "Sec")
        /** @type {string | null} */
        this.sound = sound
        /** @type {HTMLInputElement} */
        // @ts-ignore
        this._title = h("input", {
            class: "plain",
            type: "text",
            value: title || null,
            placeholder: "Title",
        })
        this.startButton = h('button', {}, "Start")
        this.removeButton = h('button', {}, "❌")
        this.restart = h('button', { class: 'hidden', html: '&#8635;' })
        this.clock = h('button', { class: "naked", "aria-label": "Click to stop.", title: "Click to stop." })
        this.alarm = h("span")
        this.optionsButton = h("button", { html: "&#9881;" })
        this.clockContainer = h('span', { class: "relative-container" },
            this.clock, this.alarm)
        this.append(
            h("div", {},
                h("label", {},
                this._title,
                h("span", { class: "editable-pencil", html: "&#9998;"}))),
            h("div", {}, 
                this.hours, ":", this.minutes, ":", this.seconds, " — ",
                this.clockContainer, this.startButton, this.restart, this.optionsButton, this.removeButton)
        )

        this.addEventListener('click', this)
        this.addEventListener('change', this)
    }

    /**
    * @param {Event} e
    */
    handleEvent(e) {
        this[`handle${e.type}`](e)
    }

    /**
    * @param {MouseEvent} e
    */
    handleclick(e) {
        switch (e.target) {
            case this.startButton:
                e.preventDefault()
                this.start()
                break
            case this.clock:
                e.preventDefault()
                this.stop()
                break
            case this.restart:
                e.preventDefault()
                this.restartClock()
                break
            case this.removeButton:
                e.preventDefault()
                this.sendNotification("timerremoved")
                break
            case this.optionsButton:
                e.preventDefault()
                this.showOptions()
                break
        }
    }

    handlechange() {
        if (this.soundSelect) {
            this.sound = sound = this.soundSelect.value
            if (this.sound === "default") {
                this.sound = null
                sound = "random"
            }
        }
        this.save()
    }

    save() {
        this.sendNotification("save")
    }

    showOptions() {
        let defaultSound = this.sound || "default"
        /** @type {HTMLSelectElement} */
        // @ts-ignore
        this.soundSelect =
                h("select", { onchange: this },
                    ...[
                        ["default", "Default"],
                        ...soundOptions
                    ].map(([value, text]) =>
                        h("option", { value, selected: defaultSound === value }, text)))

        document.body.append(
            h("x-dialog", {},
            h("dialog", { class: "modal" },
                h("div", {},
                h("h1", { class: "inline" }, "Options"),
                h("form", { class: "inline", method: "dialog" },
                    h("button", { value: "cancel" }, "Close")),
                ),
                h("label", {}, "Sound",
                h("br"),
                // @ts-ignore
                this.soundSelect
            )))
        )
    }

    /**
    * @param {number} [totalSeconds]
    */
    setClock(totalSeconds) {
        totalSeconds ??= this.getTotalSeconds()
        let hours = formatTime(Math.floor(totalSeconds / 3600))
        let minutes = formatTime(Math.floor(totalSeconds / 60) % 60)
        let seconds = formatTime(totalSeconds % 60)
        this.clock.textContent = `${hours}:${minutes}:${seconds}`
    }

    start() {
        // Set defaults when in "started" state
        this.startButton.classList.add("hidden")
        this.alarm.innerHTML = ""
        this.clock.classList.remove('overlay')
        this.restart.classList.add('hidden')
        this.setClock()
        // Start timer
        this.sendNotification("clockstarted")
        this.timeoutId = setTimeout(() => {
            this.sendNotification("timerexpired")
        }, this.getTotalSeconds() * 1e3)
        this.state = "started"
    }

    restartClock() {
        this.sendNotification("clockstopped")
        this.start()
    }

    stop() {
        // Set defaults when in "stopped" state
        this.clock.textContent = ""
        this.clock.classList.remove('overlay')
        this.alarm.innerHTML = ""
        this.startButton.classList.remove("hidden")
        this.restart.classList.add('hidden')
        this.state = "stopped"
        // Stop timer
        clearTimeout(this.timeoutId)
        this.sendNotification("clockstopped")
    }

    renderTimeExpired() {
        let alarmClone = getAlarm(this.sound || sound, this.allowedSounds)
        if (!alarmClone) return
        this.clock.textContent = ""
        this.clock.classList.add('overlay')
        this.alarm.innerHTML = alarmClone
        this.restart.classList.remove('hidden')
    }

    /**
    * @param {string} event
    */
    sendNotification(event) {
        this.dispatchEvent(new CustomEvent(event, { detail: { timer: this }, bubbles: true }))
    }

    getTotalSeconds() {
        return +this.hours.value * 3600 + +this.minutes.value * 60 + +this.seconds.value
    }
}

/**
* @param {number} num
*/
function formatTime(num) {
    return num.toString().padStart(2, "0")
}

customElements.define("x-timer", Timer)

class TimerList extends HTMLElement {

    constructor() {
        super()
        /** @type {TimerInfo} */
        this.data = JSON.parse(localStorage.getItem("timers") || `{"sound":"random","allowedSounds":[],"timers":[]}`)
        this.timers = this.data.timers
        sound = this.data.sound
        /** @type { { totalSeconds: number, timer: Timer, startedAt: number }[] } */
        this.activeTimers = []

        for (let event of [
            "clockstarted",
            "clockstopped",
            "save",
            "timerremoved",
            "timerexpired",
            "change",
            "click"]) {
            this.addEventListener(event, this)
        }

        this.addTimer = h('button', {}, "Add Timer")

        /** @type {HTMLSelectElement} */
        // @ts-ignore
        this.sound =
            h("select", {},
                ...soundOptions.map(([value, text]) =>
                    h("option", { value, selected: sound === value }, text)))

        /** @type {HTMLButtonElement} */
        // @ts-ignore
        this.options = h("button", { html: "&#9881;" })

        this.timerList =
            h("div", {},
                ...this.timers.map(t =>
                    h("div", {}, new Timer(t, this.data))))

        this.append(
            this.timerList,
            h("br"),
            h('div', {}, this.addTimer),
            h("br"),
            h("div", {},
                h("label", {}, "Sound", h("br"), this.sound),
                this.options
            )
        )
    }

    tick() {
        if (this.timerId) return
        this.updateTimers()
        this.timerId = setInterval(() => {
            this.updateTimers()
            this.tick()
        }, 1e3)
    }

    updateTimers() {
        if (this.activeTimers.length === 0) {
            clearInterval(this.timerId)
            this.timerId = void 0
            return
        }
        window.requestAnimationFrame(() => {
            for (let t of this.activeTimers) {
                t.timer.setClock(t.totalSeconds - Math.floor((Date.now() - t.startedAt) / 1e3))
            }
        })
    }

    /**
    * @param {Event} e
    */
    handleEvent(e) {
        this[`handle${e.type}`](e)
    }

    /**
    * @param {Event} e
    */
    handlechange(e) {
        this.handleAllowedSoundChange(e)
        if (this.sound === e.target) {
            sound = this.data.sound = this.sound.value
            this.save()
        }
    }

    /**
    * @param {CustomEvent} e
    */
    handletimerexpired(e) {
        let timer = e.detail.timer
        this.removeActiveTimer(timer)
        timer.renderTimeExpired()
    }

    /**
    * @param {MouseEvent} e
    */
    handleclick(e) {
        switch (e.target) {
            case this.options:
                this.showOptions()
                break
            case this.addTimer:
                let id = Math.max(...this.timers.map(t => t.id), 0) + 1
                /** @type {TimerData} */
                let data = {
                    title: "",
                    seconds: 0,
                    minutes: 0,
                    hours: 0,
                    id,
                    sound: null,
                }
                let timer = new Timer(data, this.data)
                this.timers.push({ hours: 0, minutes: 0, seconds: 0, id, title: "", sound: null })
                this.timerList.append(h("div", {}, timer))
                this.save()
                break
        }
    }

    /**
    * @param {CustomEvent} e
    */
    handleclockstarted(e) {
        let timer = e.detail.timer
        this.activeTimers.push({
            totalSeconds: timer.getTotalSeconds(),
            timer,
            startedAt: Date.now()
        })
        this.tick()
    }

    /**
    * @param {CustomEvent} e
    */
    handleclockstopped(e) {
        /** @type {Timer} */
        let timer = e.detail.timer
        this.removeActiveTimer(timer)
    }

    /**
    * @param {Timer} timer
    */
    removeActiveTimer(timer) {
        let index = this.activeTimers.findIndex(t => t.timer === timer)
        if (index === -1) return
        this.activeTimers.splice(index, 1)
    }

    /**
    * @param {CustomEvent} e
    */
    handlesave(e) {
        /** @type {Timer} */
        let timer = e.detail.timer
        let id = +timer.id
        let data = this.timers.find(t => t.id === id)
        if (!data) return
        data.hours = +timer.hours.value
        data.minutes = +timer.minutes.value
        data.seconds = +timer.seconds.value
        data.title = timer._title.value
        data.sound = timer.sound
        this.save()
    }

    /**
    * @param {CustomEvent} e
    */
    handletimerremoved(e) {
        /** @type {Timer} */
        let timer = e.detail.timer
        let id = +timer.id
        let index = this.timers.findIndex(t => t.id === id)
        this.timers.splice(index, 1)
        this.save()
        timer.remove()
    }

    showOptions() {
        let allowedSounds = this.data.allowedSounds
        if (allowedSounds.length === 0) {
            allowedSounds.push(...soundOptions.slice(1).map(([value]) => value))
        }

        let xDialog = h("x-dialog")
        xDialog.innerHTML = `
<dialog id=allowed-sounds class=modal>
    <div>
        <h2 class=inline>Options</h2>
        <form class=inline method=dialog><button value=cancel>Close</button></form>
    </div>
    <h3>Allowed Sounds</h3>
    ${soundOptions.slice(1).map(([value, title]) => `
        <div>
            <label>
                <input
                    allowed-sound
                    type=checkbox
                    value=${value}
                    ${allowedSounds.includes(value) ? "checked" : ""}>
                ${title}
            </label>
        </div>
    `).join("")}
</dialog>`

        this.append(xDialog)
    }

    /**
    * @param {Event} e
    */
    handleAllowedSoundChange(e) {
        let target = e.target
        if (!(target instanceof HTMLInputElement && target.hasAttribute("allowed-sound"))) return
        let parent = target.closest("dialog")
        if (!parent) return
        this.data.allowedSounds.length = 0
        for (let input of parent.querySelectorAll("[allowed-sound]")) {
            if (!(input instanceof HTMLInputElement && input.checked)) continue
            this.data.allowedSounds.push(input.value)
        }
        this.save()
    }

    save() {
        localStorage.setItem("timers", JSON.stringify(this.data))
    }
}

customElements.define("timer-list", TimerList)

let timerEl = document.getElementById("timer")
if (!timerEl) return

timerEl.append(new TimerList())

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
* @param {number | null} value
* @param {string} placeholder
* @returns {HTMLInputElement}
*/
function clockInputView(value, placeholder) {
    value = value || null
    // @ts-ignore
    return h('input', {
        type: "number",
        value,
        placeholder,
        class: "clock-input"
    })
}

/**
* @param {string} tag 
* @param {Record<string, string | number | boolean | Object | ((event: Event) => void)  | null>} props
* @param {(string | Node)[]} children
*/
function h(tag, props = {}, ...children) {
    const el = document.createElement(tag)
    for (let [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue
        if (v instanceof Function || v instanceof Object) {
            el.addEventListener(k.slice(2), v)
            continue
        }
        v = "" + v
        if (k === "html") {
            el.innerHTML = v
        } else {
            el.setAttribute(k, v)
        }
    }
    el.append(...children)
    return el
}

})()

