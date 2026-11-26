// The `_click` / `_change` / `_load` actions the markup names, registered on
// `window.app` for @jon49/web's dispatcher. Each changes state, then renders.
import type { AppActionContext } from "@jon49/web/app-actions.js"
import { formatClock, playAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { soundOptions } from "./shared/sounds"
import { tickCoordinator } from "./shared/tick-coordinator"
import { formatTime } from "./shared/utils"
import { render } from "./render"
import { editing, ring, start, stop, ui } from "./state"

let alarmIds = soundOptions.slice(1).map(([value]) => value)
let limits = { hours: 23, minutes: 59, seconds: 59 }

let idOf = (el: HTMLElement) => +(el.dataset.id ?? 0)

function updateTimer(id: number, patch: Partial<ReturnType<typeof timerStore.getTimer>>) {
    timerStore.updateTimer({ ...timerStore.getTimer(id), ...patch })
}

export let actions = {
    addTimer() {
        timerStore.newTimer()
        render()
    },

    deleteTimer({ el }: AppActionContext) {
        let id = idOf(el)
        stop(id)
        timerStore.deleteTimer(id)
        render()
    },

    setTitle({ el }: AppActionContext) {
        updateTimer(idOf(el), { title: (el as HTMLInputElement).value })
        render()
    },

    setTime({ el }: AppActionContext) {
        let input = el as HTMLInputElement
        let name = input.name as keyof typeof limits
        let id = idOf(el)
        let value = +input.value
        if (Number.isInteger(value) && value >= 0 && value <= limits[name]) {
            updateTimer(id, { [name]: value })
        }
        // The morph leaves the focused input alone, so normalize it here.
        input.value = formatTime(timerStore.getTimer(id)[name])
        // A running timer keeps going; the new time is for its next start.
        render()
    },

    // Shows the time's inputs in place of the time.
    async editTime({ el }: AppActionContext) {
        let id = idOf(el)
        editing.add(id)
        await render()
        document.querySelector<HTMLInputElement>(`#time-entry-${id} input`)?.focus()
    },

    start({ el }: AppActionContext) {
        start(idOf(el))
        render()
    },

    stop({ el }: AppActionContext) {
        stop(idOf(el))
        render()
    },

    openGlobalSettings() {
        ui.dialog = { type: "global" }
        render()
    },

    openTimerSettings({ el }: AppActionContext) {
        ui.dialog = { type: "timer", id: idOf(el) }
        render()
    },

    closeOnBackdrop({ ev, el }: AppActionContext) {
        if ((ev.target as HTMLElement).closest("[data-box]")) return
        ;(el as HTMLDialogElement).close()
    },

    setSound({ el }: AppActionContext) {
        let value = (el as HTMLInputElement).value
        updateTimer(idOf(el), { sound: value === "default" ? null : value })
        render()
    },

    setAllowedSounds({ form }: AppActionContext) {
        let checked = Array.from(form?.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked") ?? [])
        timerStore.setAllowedSounds(checked.map(x => x.value))
        render()
    },

    toggleAllSounds() {
        let all = timerStore.data.allowedSounds.length === alarmIds.length
        timerStore.setAllowedSounds(all ? [] : alarmIds)
        render()
    },

    downloadData,
    uploadData,

    // --- `_load` components: set up on render, torn down when they leave. ---

    // A dialog in the markup is shown as a modal; closing it removes it.
    modal({ el }: AppActionContext) {
        let dialog = el as HTMLDialogElement
        let onClose = () => {
            ui.dialog = null
            render()
        }
        dialog.addEventListener("close", onClose)
        dialog.showModal()
        return { disconnectedCallback: () => dialog.removeEventListener("close", onClose) }
    },

    // The time's inputs: being edited while the focus is in them. When it
    // leaves, the time shows again (unless it's zero).
    timeEntry({ el }: AppActionContext) {
        let id = idOf(el)
        let onFocusIn = () => editing.add(id)
        let onFocusOut = (e: FocusEvent) => {
            if (el.contains(e.relatedTarget as Node | null)) return
            editing.delete(id)
            render()
        }
        el.addEventListener("focusin", onFocusIn)
        el.addEventListener("focusout", onFocusOut)
        return {
            disconnectedCallback() {
                el.removeEventListener("focusin", onFocusIn)
                el.removeEventListener("focusout", onFocusOut)
            }
        }
    },

    // Counts down from the wall clock, then rings.
    countdown({ el }: AppActionContext) {
        let id = idOf(el)
        let end = +(el.dataset.end ?? 0)
        tickCoordinator.subscribe(id, () => (el.firstChild as Text).data = formatClock(Math.ceil((end - Date.now()) / 1e3)))
        let timeout = setTimeout(() => { ring(id); render() }, end - Date.now())
        return {
            disconnectedCallback() {
                tickCoordinator.unsubscribe(id)
                clearTimeout(timeout)
            }
        }
    },

    // Plays the alarm, and stops on its own after 2 minutes.
    alarm({ el }: AppActionContext) {
        let id = idOf(el)
        // With the focus ring, even after a mouse click (a plain focus() has none
        // then). Blurred first, since focusing the button that already has the
        // focus (Start was clicked) changes nothing.
        let clock = el.closest("button")
        clock?.blur()
        clock?.focus({ focusVisible: true })
        let url = el.dataset.url
        let stopAudio = url ? playAlarm(new Audio(), { url, title: "" }) : () => {}
        let autoStop = setTimeout(() => { stop(id); render() }, 12e4)
        return {
            disconnectedCallback() {
                clearTimeout(autoStop)
                stopAudio()
            }
        }
    },
}
