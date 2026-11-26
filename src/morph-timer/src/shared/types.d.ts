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
    // Draws the focus ring as if from the keyboard. Chrome and Firefox take it;
    // TypeScript's DOM types don't have it yet.
    interface FocusOptions {
        focusVisible?: boolean
    }
}
