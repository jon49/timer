import { Dialog } from "../components/Dialog"
import { soundOptions } from "../shared/sounds"
import { useAllowedSounds } from "../shared/data-store"
import van, { State } from "vanjs-core"

let { article, button, div, form, h2, h3, header, hr, input, label } = van.tags
let state = van.state

export function GlobalSettings() {
    let globalSettingsDialogIsOpen = state(false)

    return [
        button({
            onclick: () => globalSettingsDialogIsOpen.val = true,
            innerHTML: "&#9881;"
        }),
        div({ ondialogClosing: () => globalSettingsDialogIsOpen.val = false },
            () => globalSettingsDialogIsOpen.val ? GlobalSettingsDialog() : div()
        ),
    ]
}

function GlobalSettingsDialog() {
    let allowedSounds = useAllowedSounds()

    function handleToggle(e: Event) {
        e.preventDefault()
        e.stopPropagation()
        allowedSounds.val =
            allowedSounds.val.length === soundOptions.length - 1
                ? []
                : soundOptions.slice(1).map(([value]) => value)
    }

    return Dialog(
        article({ id: "app-settings-edit", "data-box": "" },
            header(
                button({ form: "modalClose", ariaLabel: "Close", value: "cancel", rel: "prev" }),
                h2({ class: "inline" }, "Options for All Timers"),
            ),
            h3("Allowed Sounds"),
            form({ onchange: e => handleChange(e, allowedSounds) },
                button({ onclick: handleToggle },
                    () => allowedSounds.val.length === soundOptions.length - 1
                        ? "Deselect All"
                        : "Select All"),
                hr(),
                soundOptions.slice(1).map(([value, text]) =>
                    label(
                        input({ type: "checkbox", value, ...{ checked: allowedSounds.val.includes(value) } }),
                        text
                    )
                ))
        ),
        form({ id: "modalClose", class: "inline", method: "dialog" })
    )
}

function handleChange(e: Event, allowedSounds: State<string[]>) {
    let form = e.currentTarget
    if (!(form instanceof HTMLFormElement)) return
    let sounds = Array.from(form.elements)
        .filter(el => el instanceof HTMLInputElement && el.type === "checkbox" && el.checked)
        .map((el: any) => el.value)
    allowedSounds.val = sounds
}
