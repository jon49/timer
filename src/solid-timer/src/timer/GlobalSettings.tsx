import { createEffect, createSignal, For, Show } from "solid-js"
import { CloseButton, Dialog } from "../components/Dialog"
import { timerStore } from "../shared/data-store"
import { soundOptions } from "../shared/sounds"

const alarmSounds = soundOptions.slice(1)

export function GlobalSettings() {
    const [open, setOpen] = createSignal(false)
    const [allowedSounds, setAllowedSounds] = createSignal(timerStore.data.allowedSounds)
    const allSelected = () => allowedSounds().length === alarmSounds.length

    createEffect(allowedSounds, sounds => timerStore.setAllowedSounds(sounds), { defer: true })

    function toggleAll(e: MouseEvent) {
        e.preventDefault()
        setAllowedSounds(allSelected() ? [] : alarmSounds.map(([value]) => value))
    }

    function handleChange(e: Event & { currentTarget: HTMLFormElement }) {
        const checked = Array.from(e.currentTarget.elements)
            .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && el.type === "checkbox" && el.checked)
            .map(el => el.value)
        setAllowedSounds(checked)
    }

    return (
        <>
            <button onClick={() => setOpen(true)} aria-label="Options for all timers">&#9881;</button>
            <Show when={open()}>
                <Dialog onClose={() => setOpen(false)}>
                    <article id="app-settings-edit" data-box>
                        <header>
                            <CloseButton />
                            <h2 class="inline">Options for All Timers</h2>
                        </header>
                        <h3>Allowed Sounds</h3>
                        <form onChange={handleChange}>
                            <button onClick={toggleAll}>{allSelected() ? "Deselect All" : "Select All"}</button>
                            <hr />
                            <For each={alarmSounds}>
                                {([value, text]) => (
                                    <label>
                                        <input type="checkbox" value={value} checked={allowedSounds().includes(value)} />
                                        {text}
                                    </label>
                                )}
                            </For>
                        </form>
                    </article>
                </Dialog>
            </Show>
        </>
    )
}
