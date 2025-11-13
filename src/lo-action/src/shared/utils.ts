export type TimerState = "stopped" | "running" | "alarm" | "deleting"

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

export function getXElements<T>(fragment: Element) {
    let o: any = {}
    for (let el of fragment.querySelectorAll(`[x],[id],[name]`)) {
        o[el.getAttribute("x") || el.getAttribute("id") || el.getAttribute("name") || ""] = el
        el.removeAttribute("x")
    }
    return new Proxy(o, elHandler) as T
}