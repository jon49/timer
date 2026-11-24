export interface TimerInfo {
    sound: string
    allowedSounds: string[]
    timers: TimerData[]
}

export interface TimerData {
    id: number
    hours: number
    minutes: number
    seconds: number
    title: string
    sound: string | null
}