// @ts-check

(() => {

class Timer extends HTMLElement {
    /** @type {"stopped" | "started"} */
    state = "stopped"
    /**
    * @param {number} id
    * @param {number} hours
    * @param {number} minutes
    * @param {number} seconds
    */
    constructor(id, hours, minutes, seconds) {
        super()
        this.setAttribute("id", ""+id)
        /** @type {HTMLInputElement} */
        // @ts-ignore
        this.hours = h('input', {
            value: hours || null,
            placeholder: 'Hrs',
            size: "2",
        })
        /** @type {HTMLInputElement} */
        // @ts-ignore
        this.minutes = h('input', {
            value: minutes || null,
            placeholder: 'Min',
            size: "2",
        })
        /** @type {HTMLInputElement} */
        // @ts-ignore
        this.seconds = h('input', {
            value: seconds || null,
            placeholder: 'Sec',
            size: "2",
        })
        this.button = h('button', {}, "Start")
        this.removeButton = h('button', {}, "❌")
        this.restart = h('button', { class: 'hidden', html: '&#8635;' })
        this.clock = h('span', {})
        this.append(
            this.hours, ":", this.minutes, ":", this.seconds,
            " — ", this.clock, this.button, this.restart, this.removeButton)

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
        if (e.target === this.button && this.state === "stopped") {
            e.preventDefault()
            this.state = "started"
            this.start()
        } else if (e.target === this.button && this.state === "started") {
            e.preventDefault()
            this.state = "stopped"
            this.stop()
        } else if (e.target === this.restart) {
            e.preventDefault()
            this.stop()
            this.start()
            this.state = "started"
        } else if (e.target === this.removeButton) {
            e.preventDefault()
            this.sendNotification("timerremoved")
        }
    }

    handlechange() {
        this.sendNotification("clockchanged")
    }

    /**
    * @param {number} totalSeconds
    */
    setClock(totalSeconds) {
        if (totalSeconds <= 0) {
            this.sendNotification("timerexpired")
        } else {
            let hours = formatTime(Math.floor(totalSeconds / 3600))
            let minutes = formatTime(Math.floor(totalSeconds / 60) % 60)
            let seconds = formatTime(totalSeconds % 60)
            this.clock.textContent = `${hours}:${minutes}:${seconds}`
        }
    }

    start() {
        this.sendNotification("clockstarted")
        this.button.textContent = "Stop"
    }

    stop() {
        this.sendNotification("clockstopped")
        this.clock.textContent = ""
        this.state = "stopped"
        this.button.textContent = "Start"
        this.restart.classList.add('hidden')
    }

    renderTimeExpired() {
        let bell = document.getElementById("bell")
        if (!(bell instanceof HTMLTemplateElement)) return
        let bellClone = bell.content.cloneNode(true)
        this.clock.textContent = ""
        this.clock.appendChild(bellClone)
        this.restart.classList.remove('hidden')
    }

    /**
    * @param {string} event
    */
    sendNotification(event) {
        this.dispatchEvent(new CustomEvent(event, { detail: { timer: this }, bubbles: true, composed: true }))
    }

    getTotalSeconds() {
        return +this.hours.value * 3600 + +this.minutes.value * 60 + this.seconds.value
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
*/

class TimerList extends HTMLElement {

    constructor() {
        super()
        /** @type {TimerData[]} */
        this.timers = JSON.parse(localStorage.getItem("timers") || "[]")
        /** @type { { totalSeconds: number, timer: Timer, startedAt: number }[] } */
        this.activeTimers = []

        this.addEventListener('clockstarted', this)
        this.addEventListener('clockstopped', this)
        this.addEventListener('clockchanged', this)
        this.addEventListener('click', this)
        this.addEventListener('timerremoved', this)
        this.addEventListener('timerexpired', this)

        this.addTimer = h('button', {}, "Add Timer")

        this.append(...this.timers.map(t =>
            h("div", {}, new Timer(t.id, t.hours, t.minutes, t.seconds))),
            h('div', {}, this.addTimer))
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
                t.timer.setClock(t.totalSeconds - Math.floor((Date.now() - t.startedAt) / 1000))
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
        let timer = new Timer(id, 0, 0, 0)
        this.timers.push({ hours: 0, minutes: 0, seconds: 0, id })
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
        localStorage.setItem("timers", JSON.stringify(this.timers))
    }
}

customElements.define("timer-list", TimerList)

let timerEl = document.getElementById("timer")
if (!timerEl) return

timerEl.append(new TimerList())

/**
* @param {string} tag 
* @param {Record<string, string | number | null>} props
* @param {(string | Node)[]} children
*/
function h(tag, props = {}, ...children) {
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(props)) {
        if (v == null) continue
        if (k === "html") {
            el.innerHTML = "" + v
        } else {
            el.setAttribute(k, "" + v)
        }
    }
    el.append(...children)
    return el
}

})()

