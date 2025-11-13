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

declare global {
    interface Window {
        timers: HTMLSectionElement
        timerTemplate: HTMLTemplateElement
        appSettings: HTMLDialogElement
        allowedSounds: HTMLFieldSetElement
        app?: Record<string, (ev: Event) => void>
        dataAction: (event: Event) => void
    }
    interface Element {
        app?: any
    }
}
