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

export function useTimers(): [number[], (timerIds: number[]) => void] {
    let [timerIds, setTimerIds] = useState(timerStore.timerIds)
    subscribe("newTimer", () => {
        let timer: TimerData = { id: newId(timerStore.timerIds), hours: 0, minutes: 0, seconds: 0, title: "", sound: null }
        timerStore.updateTimer(timer)
        setTimerIds(timerStore.timerIds)
    }, [])
    subscribe("deleteTimer", (id: number) => {
        timerStore.deleteTimer(id)
        setTimerIds(timerStore.timerIds)
    }, [])
    return [timerIds, setTimerIds]
}

export function useAllowedSounds(): [string[], (sounds: string[]) => void] {
    let [sounds, setSounds] = useState(timerStore.data.allowedSounds)
    let update = (sounds: string[]) => {
        timerStore.data.allowedSounds = sounds
        timerStore.save()
        setSounds(sounds)
    }
    return [sounds, update]
}

export function useTimer(id: number): [TimerData, (timer: TimerData) => void] {
    let [timer, setTimer] = useState(timerStore.getTimer(id))
    return [timer, (timer: TimerData) => {
        timerStore.updateTimer(timer)
        setTimer(timer)
    }]
}

function newId(ids: number[]) {
    if (ids.length == 0) {
        return 1
    }
    return Math.max(...ids) + 1
}
