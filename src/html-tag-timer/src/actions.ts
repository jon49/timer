// The `_click` / `_change` / `_load` actions the markup names, registered on
// `window.app` for @jon49/web's dispatcher. Each changes state, then renders
// only what that change touches: one clock, or the dialog.
import type { AppActionContext } from "@jon49/web/app-actions.js"
import { formatClock, playAlarm } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { soundOptions } from "./shared/sounds"
import { tickCoordinator } from "./shared/tick-coordinator"
import { formatTime } from "./shared/utils"
import { appendTimer, removeTimer, renderAllowedSounds, renderClock, renderDialog, renderTime } from "./render"
import { editing, ring, start, stop, ui } from "./state"

let alarmIds = soundOptions.slice(1).map(([value]) => value)
let limits = { hours: 23, minutes: 59, seconds: 59 }

let idOf = (el: HTMLElement) => +(el.dataset.id ?? 0)

function updateTimer(id: number, patch: Partial<ReturnType<typeof timerStore.getTimer>>) {
    timerStore.updateTimer({ ...timerStore.getTimer(id), ...patch })
}

// A time's inputs are being edited while the focus is in them. When it leaves
// them, the time shows again (unless it's zero). One listener for every card,
// rather than a `_load` component each: starting those means a new card has to
// send `hz:completed`, which scans the whole page.
let timeEntryOf = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>(".time-entry") : null
document.addEventListener("focusin", e => {
    let entry = timeEntryOf(e.target)
    if (entry) editing.add(idOf(entry))
})
document.addEventListener("focusout", e => {
    let entry = timeEntryOf(e.target)
    if (!entry || entry.contains(e.relatedTarget as Node | null)) return
    editing.delete(idOf(entry))
    renderTime(idOf(entry))
})

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
        input.value = formatTime(timerStore.getTimer(id)[name])
        // A running timer keeps going; the new time is for its next start.
        renderTime(id)
    },

    // Shows the time's inputs in place of the time.
    editTime({ el }: AppActionContext) {
        let id = idOf(el)
        editing.add(id)
        renderTime(id)
        document.querySelector<HTMLInputElement>(`#time-entry-${id} input`)?.focus()
    },

    start({ el }: AppActionContext) {
        start(idOf(el))
        renderClock(idOf(el))
    },

    stop({ el }: AppActionContext) {
        stop(idOf(el))
        renderClock(idOf(el))
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
        // The radio already shows the choice.
        updateTimer(idOf(el), { sound: value === "default" ? null : value })
    },

    setAllowedSounds({ form }: AppActionContext) {
        let checked = Array.from(form?.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked") ?? [])
        timerStore.setAllowedSounds(checked.map(x => x.value))
        renderAllowedSounds()
    },

    toggleAllSounds() {
        let all = timerStore.data.allowedSounds.length === alarmIds.length
        timerStore.setAllowedSounds(all ? [] : alarmIds)
        renderAllowedSounds()
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
        tickCoordinator.subscribe(id, () => (el.firstChild as Text).data = formatClock(Math.ceil((end - Date.now()) / 1e3)))
        let timeout = setTimeout(() => { ring(id); renderClock(id) }, end - Date.now())
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
        let autoStop = setTimeout(() => { stop(id); renderClock(id) }, 12e4)
        return {
            disconnectedCallback() {
                clearTimeout(autoStop)
                stopAudio()
            }
        }
    },
}
