import { useState } from "react"
import { TimerData, TimerInfo } from "./types"
import { subscribe } from "./messaging"

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

    get timerIds() {
        return this.data.timers.map(t => t.id)
    }

    get sound() {
        return this.data.sound
    }
}

let store = new TimerStore()

export function useTimers(): [number[], (timerIds: number[]) => void] {
    let [timerIds, setTimerIds] = useState(store.timerIds)
    subscribe("newTimer", () => {
        let timer: TimerData = { id: newId(store.timerIds), hours: 0, minutes: 0, seconds: 0, title: "", sound: null }
        store.updateTimer(timer)
        setTimerIds(store.timerIds)
    }, [])
    subscribe("deleteTimer", (id: number) => {
        store.deleteTimer(id)
        setTimerIds(store.timerIds)
    }, [])
    return [timerIds, setTimerIds]
}

export function useTimer(id: number): [TimerData, (timer: TimerData) => void] {
    let [timer, setTimer] = useState(store.getTimer(id))
    return [timer, (timer: TimerData) => {
        store.updateTimer(timer)
        setTimer(timer)
    }]
}

function newId(ids: number[]) {
    if (ids.length == 0) {
        return 1
    }
    return Math.max(...ids) + 1
}
