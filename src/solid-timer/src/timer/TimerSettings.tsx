import { For } from "solid-js"
import { CloseButton, Dialog } from "../components/Dialog"
import { soundOptions } from "../shared/sounds"

export function TimerSettings(props: {
    sound: string | null
    onSoundChange: (sound: string | null) => void
    onClose: () => void
}) {
    function handleChange(e: Event) {
        const value = (e.target as HTMLInputElement).value
        props.onSoundChange(value === "default" ? null : value)
    }

    return (
        <Dialog onClose={() => props.onClose()}>
            <article data-box>
                <header>
                    <CloseButton />
                    <h2 class="inline">Options</h2>
                </header>
                <fieldset onChange={handleChange}>
                    <legend>Sound</legend>
                    <label>
                        <input type="radio" name="sound" value="default" checked={props.sound == null} />
                        Default
                    </label>
                    <For each={soundOptions}>
                        {([value, text]) => (
                            <label>
                                <input type="radio" name="sound" value={value} checked={value === props.sound} />
                                {text}
                            </label>
                        )}
                    </For>
                </fieldset>
            </article>
        </Dialog>
    )
}
