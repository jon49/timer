import { useState } from "react"
import { Dialog } from "../components/Dialog"
import { subscribe } from "../shared/messaging"
import { soundOptions } from "../shared/sounds"
import { useAllowedSounds } from "../shared/data-store"

export function GlobalSettings() {
    let [globalSettingsDialogIsOpen, setGlobalSettingsDialogIsOpen] = useState(false)

    subscribe("dialogClosed", () => setGlobalSettingsDialogIsOpen(false), [])

    return (
        <>
            <button onClick={() => setGlobalSettingsDialogIsOpen(true)}>&#9881;</button>
            {globalSettingsDialogIsOpen && <GlobalSettingsDialog />}
        </>
    )
}

function GlobalSettingsDialog() {
    let [allowedSounds, setAllowedSounds] = useAllowedSounds()

    function handleToggle(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        e.preventDefault()
        e.stopPropagation()
        setAllowedSounds(
            allowedSounds.length === soundOptions.length - 1
                ? []
            : soundOptions.slice(1).map(([value]) => value))
    }

    return (
        <Dialog>
            <article id="app-settings-edit" data-box>
                <header>
                    <button form="modalClose" aria-label="Close" value="cancel" rel="prev"></button>
                    <h2 className="inline">Options for All Timers</h2>
                </header>
                <h3>Allowed Sounds</h3>
                <form onChange={e => { handleChange(e, setAllowedSounds) }}>
                    <button onClick={handleToggle}>{
                        allowedSounds.length === soundOptions.length - 1
                            ? "Deselect All"
                            : "Select All"
                    }</button>
                    <hr />
                    {soundOptions.slice(1).map(([value, text]) =>
                        <label>
                            <input type="checkbox" value={value} {...{ checked: allowedSounds.includes(value) }} />
                            {text}
                        </label>)
                    }
                </form>
            </article>
            <form id="modalClose" className="inline" method="dialog"></form>
        </Dialog>
    )
}

function handleChange(e: React.FormEvent<HTMLFormElement>, setAllowedSounds: (sounds: string[]) => void) {
    let form = e.currentTarget
    let sounds = Array.from(form.elements)
        .filter(el => el instanceof HTMLInputElement && el.type === "checkbox" && el.checked)
        .map((el: any) => el.value)
    setAllowedSounds(sounds)
}
