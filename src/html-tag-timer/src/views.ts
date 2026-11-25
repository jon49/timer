import htmlTag from "html-template-tag"
import { formatClock } from "./shared/alarm"
import { timerStore } from "./shared/data-store"
import { soundOptions } from "./shared/sounds"
import type { TimerData } from "./shared/types"
import { formatTime } from "./shared/utils"
import { runs, ui } from "./state"

// `${x}` is escaped, `$${x}` goes in as is, and an array is joined as is. A view
// returns a string, so a nested view goes in with `$${}`. (The tag's own type
// takes only strings, but it stringifies whatever it's given.)
let html = htmlTag as (literals: TemplateStringsArray, ...values: unknown[]) => string

let alarmSounds = soundOptions.slice(1)
let when = (b: unknown, s: string) => b ? s : ""

export function timersView() {
    return timerStore.data.timers.map(t => timerView(t.id)).join("")
}

export function timerView(id: number) {
    let t = timerStore.getTimer(id)
    return html`
<article id="timer-${id}">
    <header class="pb-0">
        <fieldset role="group">
            <input id="timer-title-${id}" class="plain" name="title" type="text" placeholder="Title"
                value="${t.title}" data-id="${id}" _change="setTitle">
            <label for="timer-title-${id}" aria-label="Timer Title">&#9998;</label>
        </fieldset>
    </header>
    <fieldset role="group">
        ${(["hours", "minutes", "seconds"] as const).map(name => html`
        <input name="${name}" type="number" placeholder="${name[0]}"
            value="${formatTime(t[name])}" data-id="${id}" _change="setTime">`)}
    </fieldset>
    <div class="flex justify-between">
        <div class="flex">
            $${clockView(id)}
            <button id="restart-${id}" data-id="${id}" _click="start" aria-label="Restart" $${when(!runs.has(id), "hidden")}>&#8635;</button>
            <button data-id="${id}" _click="openTimerSettings" aria-label="Timer options">&#9881;</button>
            <button data-id="${id}" _click="deleteTimer" aria-label="Delete timer">❌</button>
        </div>
    </div>
</article>`
}

// Starting, stopping and ringing change only this button (and whether the
// restart button is hidden), so it's rendered on its own.
export function clockView(id: number) {
    let run = runs.get(id)
    if (!run) return html`
<button id="clock-${id}" data-id="${id}" _click="start" style="width: 140px"
    title="Click to stop." aria-label="Click to start.">Start</button>`

    if (run.state === "running") return html`
<button id="clock-${id}" data-id="${id}" _click="stop" style="width: 140px"
    title="Click to stop." aria-label="Click to stop."
    ><span _load="countdown" data-id="${id}" data-end="${run.end}"
    >${formatClock(Math.ceil((run.end - Date.now()) / 1e3))}</span></button>`

    return html`
<button id="clock-${id}" data-id="${id}" _click="stop" style="width: 140px"
    title="${run.sound?.title ?? ""}" aria-label="Click to start."
    ><span _load="alarm" data-id="${id}" data-url="${run.sound?.url ?? ""}"
    >Stop</span></button>`
}

export function dialogView() {
    let dialog = ui.dialog
    if (!dialog) return ""
    return dialog.type === "global" ? globalSettingsView() : timerSettingsView(timerStore.getTimer(dialog.id))
}

function dialogShell(id: string, title: string, body: string) {
    return html`
<dialog id="${id}" _load="modal" _click="closeOnBackdrop">
    <article data-box>
        <header>
            <button form="modal-close" aria-label="Close" value="cancel" rel="prev"></button>
            <h2 class="inline">${title}</h2>
        </header>
        $${body}
    </article>
    <form id="modal-close" class="inline" method="dialog"></form>
</dialog>`
}

function globalSettingsView() {
    return dialogShell("dialog-global", "Options for All Timers", html`
<h3>Allowed Sounds</h3>
<form id="allowed-sounds">$${allowedSoundsView()}</form>`)
}

// The ids let the focus go back to the same control after a render.
export function allowedSoundsView() {
    let allowed = timerStore.data.allowedSounds
    let allSelected = allowed.length === alarmSounds.length
    return html`
<button id="toggle-sounds" type="button" _click="toggleAllSounds">${allSelected ? "Deselect All" : "Select All"}</button>
<hr>
${alarmSounds.map(([value, text]) => html`
<label>
    <input id="allowed-${value}" type="checkbox" value="${value}" _change="setAllowedSounds" $${when(allowed.includes(value), "checked")}>
    ${text}
</label>`)}`
}

function timerSettingsView(t: TimerData) {
    let option = (value: string, text: string, checked: boolean) => html`
<label>
    <input type="radio" name="sound" value="${value}" data-id="${t.id}" _change="setSound" $${when(checked, "checked")}>
    ${text}
</label>`
    return dialogShell(`dialog-timer-${t.id}`, "Options", html`
<fieldset>
    <legend>Sound</legend>
    $${option("default", "Default", t.sound == null)}
    ${soundOptions.map(([value, text]) => option(value, text, value === t.sound))}
</fieldset>`)
}
