// Puts views into the page. Each function renders only what one kind of change
// touches, by setting `innerHTML`/`outerHTML` on it.
import { runs, showsTimeEntry } from "./state"
import { allowedSoundsView, clockView, dialogView, timersView, timeView, timerView } from "./views"

let $ = (id: string) => document.getElementById(id)

// @jon49/web's "the DOM changed" signal: disconnects the `_load` components
// that left and runs the new ones.
let changed = () => document.dispatchEvent(new CustomEvent("hz:completed"))

// Replaces `el` (or its contents). If the focus was in what got replaced, it
// goes to the new element with the same id.
function swap(el: Element | null, html: string, where: "outerHTML" | "innerHTML") {
    if (!el) return
    let focused = document.activeElement
    el[where] = html
    if (focused && !focused.isConnected && focused.id) $(focused.id)?.focus()
    changed()
}

// Every timer, once at startup.
export function renderTimers() {
    swap($("timers"), timersView(), "innerHTML")
}

// A timer's clock and time, after it starts, stops or rings.
export function renderClock(id: number) {
    swap($(`clock-${id}`), clockView(id), "outerHTML")
    let restart = $(`restart-${id}`)
    if (restart) restart.hidden = !runs.has(id)
    renderTime(id)
}

// A timer's time, after it changes or its inputs show or hide. The inputs are
// only shown or hidden, so the one being typed in stays as it is.
export function renderTime(id: number) {
    swap($(`time-${id}`), timeView(id), "outerHTML")
    let entry = $(`time-entry-${id}`)
    if (entry) entry.hidden = !showsTimeEntry(id)
}

// A new timer's card, added after the others.
export function appendTimer(id: number) {
    $("timers")?.insertAdjacentHTML("beforeend", timerView(id))
}

export function removeTimer(id: number) {
    $(`timer-${id}`)?.remove()
}

// The dialog, when it opens or closes.
export function renderDialog() {
    swap($("dialog"), dialogView(), "innerHTML")
}

// The checkboxes and the Select All button in the global options.
export function renderAllowedSounds() {
    swap($("allowed-sounds"), allowedSoundsView(), "innerHTML")
}
