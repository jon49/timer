export type TimerState = "stopped" | "running" | "alarm"

export function formatTime(time: number, defaultValue = "") {
    if (!time) return defaultValue
    return ("" + time).padStart(2, "0")
}

const elHandler = {
    get(obj: any, prop: string) {
        if (prop[0] === "$") {
            return obj[prop.slice(1)]
        }
        let val = obj[prop]
        if (!(val instanceof HTMLElement)) return
        if (isInputElement(val)) {
            if (val.type === "number") {
                return +val.value
            }
            return val.value
        }
        return val.textContent
    },

    set(obj: any, prop: string, newVal: any) {
        let val = obj[prop]
        if (!(val instanceof HTMLElement)) return false
        if (isInputElement(val)) {
            val.value = newVal
            return true
        }
        val.textContent = newVal
        return true
    }
}

function isInputElement(obj: unknown) {
    return obj instanceof HTMLInputElement || obj instanceof HTMLSelectElement
}

// The elements in `fragment` with an `x` attribute, by that name: `$.name` reads
// or writes an input's value or an element's text, `$.$name` is the element.
export function getXElements<T>(fragment: Element) {
    let o: any = {}
    for (let el of fragment.querySelectorAll(`[x]`)) {
        o[el.getAttribute("x") || ""] = el
        el.removeAttribute("x")
    }
    return new Proxy(o, elHandler) as T
}

// A copy of the dialog with this id from <template id="dialogTemplates">.
export function cloneDialog(id: string) {
    let templates = document.getElementById("dialogTemplates") as HTMLTemplateElement
    return templates.content.getElementById(id)!.cloneNode(true) as HTMLDialogElement
}

// Shows a cloned dialog as a modal, with `app` handling its actions. Clicking
// the backdrop (outside the [data-box] content) closes it; closing removes it.
export function showDialog(dialog: HTMLDialogElement, app: object) {
    dialog.app = app
    dialog.addEventListener("click", e => {
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialog.close()
    })
    dialog.addEventListener("close", () => dialog.remove())
    document.body.append(dialog)
    dialog.showModal()
}
