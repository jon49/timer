/// <reference path="../node_modules/@jon49/web/lib/idiomorph.d.ts" />
import { Idiomorph } from "idiomorph"
import { appView } from "./views"

let root = document.getElementById("app")!
let queued = false
let rendering = Promise.resolve()

// Renders the whole app to HTML and morphs it into the page. Calls in the same
// tick share one render. Returns when it's done.
export function render() {
    if (queued) return rendering
    queued = true
    return rendering = rendering.then(async () => {
        queued = false
        let text = ""
        for await (let s of appView()) text += s
        Idiomorph.morph(root, text, {
            morphStyle: "innerHTML",
            callbacks: {
                // Leave the input the user is typing in alone. (idiomorph's
                // ignoreActiveValue also freezes a focused button's content.)
                beforeNodeMorphed: node => !(node === document.activeElement && node instanceof HTMLInputElement),
                // A dialog opened with showModal() has an `open` attribute the
                // markup doesn't; keep it, or the morph would close the dialog.
                beforeAttributeUpdated: (name, node) => !(name === "open" && node.tagName === "DIALOG"),
            },
        })
        // @jon49/web's "the DOM changed" signal: runs new `_load` components and
        // disconnects the ones that left.
        document.dispatchEvent(new CustomEvent("hz:completed"))
    }).catch(x => console.error(x))
}
