// @ts-check

(() => {

let sound = "random"

class Timer extends HTMLElement {
    /** @type {"stopped" | "started"} */
    state = "stopped"
    /**
    * @param {number} id
    * @param {number} hours
    * @param {number} minutes
    * @param {number} seconds
    * @param {string} title
    */
    constructor(id, hours, minutes, seconds, title) {
        super()
        this.setAttribute("id", ""+id)
        this.hours = clockInputView(hours, "Hrs")
        this.minutes = clockInputView(minutes, "Min")
        this.seconds = clockInputView(seconds, "Sec")
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
        this.clock = h('span', { class: "pointer", "aria-label": "Click to stop.", title: "Click to stop." })
        this.alarm = h("span")
        this.clockContainer = h('span', { class: "relative-container" },
            this.clock, this.alarm)
        this.append(
            h("div", {},
                h("label", {},
                this._title,
                h("span", { class: "editable-pencil", html: "&#9998;"}))),
            h("div", {}, 
                this.hours, ":", this.minutes, ":", this.seconds, " — ",
                this.clockContainer, this.startButton, this.restart, this.removeButton)
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
        e.preventDefault()
        switch (e.target) {
            case this.startButton:
                this.start()
                break
            case this.clock:
                this.stop()
                break
            case this.restart:
                this.restartClock()
                break
            case this.removeButton:
                this.sendNotification("timerremoved")
                break
        }
    }

    handlechange() {
        this.sendNotification("clockchanged")
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
        this.alarm.textContent = ""
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
        this.alarm.textContent = ""
        this.startButton.classList.remove("hidden")
        this.clock.classList.remove('overlay')
        this.restart.classList.add('hidden')
        this.state = "stopped"
        // Stop timer
        clearTimeout(this.timeoutId)
        this.sendNotification("clockstopped")
    }

    renderTimeExpired() {
        let alarmClone = getAlarm(sound)
        if (!alarmClone) return
        this.clock.textContent = ""
        this.clock.classList.add('overlay')
        this.alarm.appendChild(alarmClone)
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

/**
* @typedef {Object} TimerData
* @property {number} id
* @property {number} hours
* @property {number} minutes
* @property {number} seconds
* @property {string} title
*/

class TimerList extends HTMLElement {

    constructor() {
        super()
        /** @type {{ sound: string, timers: TimerData[]}} */
        this.data = JSON.parse(localStorage.getItem("timers") || `{"sound":"random","timers":[]}`)
        if (Array.isArray(this.data)) {
            this.data = { sound: "random", timers: this.data }
        }
        this.timers = this.data.timers
        sound = this.data.sound
        /** @type { { totalSeconds: number, timer: Timer, startedAt: number }[] } */
        this.activeTimers = []

        for (let event of [
            "clockstarted",
            "clockstopped",
            "clockchanged",
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
            h("select", { id: "sound" },
                h("option", { value: "random", selected: sound === "random" }, "Random"),
                h("option", { value: "bell", selected: sound === "bell" }, "Bell"),
                h("option", { value: "warfare", selected: sound === "warfare" }, "Warfare"),
                h("option", { value: "fire-truck", selected: sound === "fire-truck" }, "Fire Truck"),
                h("option", { value: "air-raid", selected: sound === "air-raid" }, "Air Raid"),
                h("option", { value: "song", selected: sound === "song" }, "Song")
            )

        this.append(...this.timers.map(t =>
            h("div", {}, new Timer(t.id, t.hours, t.minutes, t.seconds, t.title))),
            h("br"),
            h('div', {}, this.addTimer),
            h("br"),
            h("div", {}, h("label", {}, "Sound", h("br"), this.sound))
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
        if (e.target !== this.addTimer) return
        let id = Math.max(...this.timers.map(t => t.id), 0) + 1
        let timer = new Timer(id, 0, 0, 0, "")
        this.timers.push({ hours: 0, minutes: 0, seconds: 0, id, title: "" })
        this.insertBefore(h("div", {}, timer), this.addTimer.parentElement)
        this.save()
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
    handleclockchanged(e) {
        /** @type {Timer} */
        let timer = e.detail.timer
        let id = +timer.id
        let data = this.timers.find(t => t.id === id)
        if (!data) return
        data.hours = +timer.hours.value
        data.minutes = +timer.minutes.value
        data.seconds = +timer.seconds.value
        data.title = timer._title.value
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

    save() {
        localStorage.setItem("timers", JSON.stringify(this.data))
    }
}

customElements.define("timer-list", TimerList)

let timerEl = document.getElementById("timer")
if (!timerEl) return

timerEl.append(new TimerList())

let alarmIds = ["bell", "warfare", "fire-truck", "air-raid", "song"]
/**
* @param {string} sound
*/
function getAlarm(sound) {
    if (sound === "random") return getAlarm(alarmIds[Math.floor(Math.random() * alarmIds.length)])
    let alarm = document.getElementById(sound)
    if (!(alarm instanceof HTMLTemplateElement)) {
        console.error(`Alarm with id ${sound} not found`)
        return
    }
    return alarm.content.cloneNode(true)
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
* @param {Record<string, string | number | boolean | null>} props
* @param {(string | Node)[]} children
*/
function h(tag, props = {}, ...children) {
    const el = document.createElement(tag)
    for (let [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue
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

