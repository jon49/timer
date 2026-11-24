// The `_click` / `_change` / `_load` actions the markup names, registered on
// `window.app` for @jon49/web's dispatcher. Each changes state, then renders
// only what that change touches: one timer's card, or the open dialog.
import type { AppActionContext } from "@jon49/web/app-actions.js"
import { formatClock, playAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { soundOptions } from "./shared/sounds"
import { tickCoordinator } from "./shared/tick-coordinator"
import { formatTime } from "./shared/utils"
import { appendTimer, removeTimer, renderDialog, renderTimer } from "./render"
import { ring, start, stop, ui } from "./state"

let alarmIds = soundOptions.slice(1).map(([value]) => value)
let limits = { hours: 23, minutes: 59, seconds: 59 }

let idOf = (el: HTMLElement) => +(el.dataset.id ?? 0)

function updateTimer(id: number, patch: Partial<ReturnType<typeof timerStore.getTimer>>) {
    timerStore.updateTimer({ ...timerStore.getTimer(id), ...patch })
}

export let actions = {
    addTimer() {
        appendTimer(timerStore.newTimer().id)
    },

    deleteTimer({ el }: AppActionContext) {
        let id = idOf(el)
        stop(id)
        timerStore.deleteTimer(id)
        removeTimer(id)
    },

    setTitle({ el }: AppActionContext) {
        updateTimer(idOf(el), { title: (el as HTMLInputElement).value })
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
        renderTimer(id)
    },

    start({ el }: AppActionContext) {
        start(idOf(el))
        renderTimer(idOf(el))
    },

    stop({ el }: AppActionContext) {
        stop(idOf(el))
        renderTimer(idOf(el))
    },

    openGlobalSettings() {
        ui.dialog = { type: "global" }
        renderDialog()
    },

    openTimerSettings({ el }: AppActionContext) {
        ui.dialog = { type: "timer", id: idOf(el) }
        renderDialog()
    },

    closeOnBackdrop({ ev, el }: AppActionContext) {
        if ((ev.target as HTMLElement).closest("[data-box]")) return
        ;(el as HTMLDialogElement).close()
    },

    setSound({ el }: AppActionContext) {
        let value = (el as HTMLInputElement).value
        updateTimer(idOf(el), { sound: value === "default" ? null : value })
        renderDialog()
    },

    setAllowedSounds({ form }: AppActionContext) {
        let checked = Array.from(form?.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked") ?? [])
        timerStore.setAllowedSounds(checked.map(x => x.value))
        renderDialog()
    },

    toggleAllSounds() {
        let all = timerStore.data.allowedSounds.length === alarmIds.length
        timerStore.setAllowedSounds(all ? [] : alarmIds)
        renderDialog()
    },

    downloadData,
    uploadData,

    // --- `_load` components: set up on render, torn down when they leave. ---

    // A dialog in the markup is shown as a modal; closing it removes it.
    modal({ el }: AppActionContext) {
        let dialog = el as HTMLDialogElement
        let onClose = () => {
            ui.dialog = null
            renderDialog()
        }
        dialog.addEventListener("close", onClose)
        dialog.showModal()
        return { disconnectedCallback: () => dialog.removeEventListener("close", onClose) }
    },

    // Counts down from the wall clock, then rings.
    countdown({ el }: AppActionContext) {
        let id = idOf(el)
        let end = +(el.dataset.end ?? 0)
        tickCoordinator.subscribe(id, () => el.textContent = formatClock(Math.ceil((end - Date.now()) / 1e3)))
        let timeout = setTimeout(() => { ring(id); renderTimer(id) }, end - Date.now())
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
        el.closest("button")?.focus()
        let url = el.dataset.url
        let stopAudio = url ? playAlarm(new Audio(), { url, title: "" }) : () => {}
        let autoStop = setTimeout(() => { stop(id); renderTimer(id) }, 12e4)
        return {
            disconnectedCallback() {
                clearTimeout(autoStop)
                stopAudio()
            }
        }
    },
}
