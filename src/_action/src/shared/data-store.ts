import { TimerData, TimerInfo } from "./types"

let appStateKey = "timers"

class TimerStore {
    data: TimerInfo
    constructor() {
        let data = JSON.parse(localStorage.getItem(appStateKey) ?? "null")
        if (data == null) {
            data = { sound: "random", timers: [], allowedSounds: [] }
        }
        if (data.allowedSounds == null) {
            data.allowedSounds = []
        }
        this.data = data
    }

    save() {
        localStorage.setItem(appStateKey, JSON.stringify(this.data))
    }

    updateTimer(timer: TimerData) {
        let index = this.data.timers.findIndex(t => t.id === timer.id)
        if (index == -1) {
            this.data.timers.push(timer)
        } else {
            this.data.timers[index] = timer
        }
        this.save()
    }

    deleteTimer(id: number) {
        this.data.timers = this.data.timers.filter(t => t.id != id)
        this.save()
    }

    getTimer(id: number) {
        return this.data.timers.find(t => t.id == id) ?? { id: id, hours: 0, minutes: 0, seconds: 0, title: "", sound: null }
    }

    getTotalTime(timer: { hours: number, minutes: number, seconds: number }) {
        return timer.hours * 3600 + timer.minutes * 60 + timer.seconds
    }

    get timerIds() {
        return this.data.timers.map(t => t.id)
    }

    get timers() {
        return this.data.timers
    }

    get sound() {
        return this.data.sound
    }

    newTimer() {
        let id = newId(this.timerIds)
        let timer: TimerData = { id: id, hours: 0, minutes: 0, seconds: 0, title: "", sound: null }
        this.updateTimer(timer)
        return timer
    }
}

export let timerStore = new TimerStore()

function newId(ids: number[]) {
    if (ids.length == 0) {
        return 1
    }
    return Math.max(...ids) + 1
}
