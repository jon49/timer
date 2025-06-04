import { TimerData, TimerInfo } from "./types"
import { publish, subscribe } from "./messaging"
import van from "vanjs-core"

let state = van.state

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

    getTotalTime(id: number) {
        let timer = this.data.timers.find(t => t.id === id)
        if (!timer) return 0
        return timer.hours * 3600 + timer.minutes * 60 + timer.seconds
    }

    get timerIds() {
        return this.data.timers.map(t => t.id)
    }

    get sound() {
        return this.data.sound
    }
}

export let timerStore = new TimerStore()

export function useTimers() {
    let timerIds = timerStore.timerIds
    subscribe("newTimer", () => {
        let timer: TimerData = { id: newId(timerStore.timerIds), hours: 0, minutes: 0, seconds: 0, title: "", sound: null }
        timerStore.updateTimer(timer)
        publish("timerAdded", timer.id)
    })
    subscribe("deleteTimer", (id: number) => {
        timerStore.deleteTimer(id)
        publish("unsubscribe", { key: id })
        // @ts-expect-error
        window[`appTimer${id}`]?.remove()
    })
    return timerIds
}

export function useAllowedSounds() {
    let sounds = state(timerStore.data.allowedSounds)
    van.derive(() => {
        timerStore.data.allowedSounds = sounds.val
        timerStore.save()
    })
    return sounds
}

export function useTimer(id: number) {
    let timer = state(timerStore.getTimer(id))
    van.derive(() => {
        timerStore.updateTimer(timer.val)
    })
    return timer
}

function newId(ids: number[]) {
    if (ids.length == 0) {
        return 1
    }
    return Math.max(...ids) + 1
}
