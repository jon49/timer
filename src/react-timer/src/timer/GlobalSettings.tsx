import { useState } from "react"
import { CloseButton, Dialog } from "../components/Dialog"
import { timerStore } from "../shared/data-store"
import { soundOptions } from "../shared/sounds"

let alarmSounds = soundOptions.slice(1)

export function GlobalSettings() {
    let [open, setOpen] = useState(false)
    let [allowedSounds, setAllowed] = useState(() => timerStore.data.allowedSounds)
    let allSelected = allowedSounds.length === alarmSounds.length

    function setAllowedSounds(sounds: string[]) {
        timerStore.setAllowedSounds(sounds)
        setAllowed(sounds)
    }

    function toggleAll(e: React.MouseEvent) {
        e.preventDefault()
        setAllowedSounds(allSelected ? [] : alarmSounds.map(([value]) => value))
    }

    function toggle(value: string, checked: boolean) {
        setAllowedSounds(checked
            ? alarmSounds.map(([v]) => v).filter(v => v === value || allowedSounds.includes(v))
            : allowedSounds.filter(v => v !== value))
    }

    return (
        <>
            <button onClick={() => setOpen(true)} aria-label="Options for all timers">&#9881;</button>
            {open && (
                <Dialog onClose={() => setOpen(false)}>
                    <article id="app-settings-edit" data-box>
                        <header>
                            <CloseButton />
                            <h2 className="inline">Options for All Timers</h2>
                        </header>
                        <h3>Allowed Sounds</h3>
                        <form>
                            <button onClick={toggleAll}>{allSelected ? "Deselect All" : "Select All"}</button>
                            <hr />
                            {alarmSounds.map(([value, text]) => (
                                <label key={value}>
                                    <input type="checkbox" value={value} checked={allowedSounds.includes(value)}
                                        onChange={e => toggle(value, e.currentTarget.checked)} />
                                    {text}
                                </label>
                            ))}
                        </form>
                    </article>
                </Dialog>
            )}
        </>
    )
}
