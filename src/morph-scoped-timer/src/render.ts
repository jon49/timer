/// <reference path="../node_modules/@jon49/web/lib/idiomorph.d.ts" />
import { Idiomorph } from "idiomorph"
import { dialogView, timersView, timerView } from "./views"

type Html = AsyncGenerator<string, void, unknown>

// Renders run one after another, so a later one never lands under an earlier one.
let rendering = Promise.resolve()

async function text(view: Html) {
    let s = ""
    for await (let x of view) s += x
    return s
}

// Returns when this render is done.
function run(work: () => Promise<void>) {
    return rendering = rendering.then(async () => {
        await work()
        // @jon49/web's "the DOM changed" signal: runs new `_load` components and
        // disconnects the ones that left.
        document.dispatchEvent(new CustomEvent("hz:completed"))
    }).catch(x => console.error(x))
}

function morph(target: Element | null, html: string, morphStyle: "outerHTML" | "innerHTML") {
    if (!target) return
    Idiomorph.morph(target, html, {
        morphStyle,
        callbacks: {
            // Leave the input the user is typing in alone. (idiomorph's
            // ignoreActiveValue also freezes a focused button's content.)
            beforeNodeMorphed: node => !(node === document.activeElement && node instanceof HTMLInputElement),
            // A dialog opened with showModal() has an `open` attribute the
            // markup doesn't; keep it, or the morph would close the dialog.
            beforeAttributeUpdated: (name, node) => !(name === "open" && node.tagName === "DIALOG"),
        },
    })
}

let $ = (id: string) => document.getElementById(id)

// Every timer, once at startup.
export function renderTimers() {
    run(async () => morph($("timers"), await text(timersView()), "innerHTML"))
}

// One timer's card, and nothing else.
export function renderTimer(id: number) {
    return run(async () => morph($(`timer-${id}`), await text(timerView(id)), "outerHTML"))
}

// A new timer's card, added after the others.
export function appendTimer(id: number) {
    run(async () => $("timers")?.insertAdjacentHTML("beforeend", await text(timerView(id))))
}

export function removeTimer(id: number) {
    run(async () => $(`timer-${id}`)?.remove())
}

// The open dialog, if any.
export function renderDialog() {
    run(async () => morph($("dialog"), await text(dialogView()), "innerHTML"))
}
