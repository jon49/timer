import { CloseButton, Dialog } from "../components/Dialog"
import { soundOptions } from "../shared/sounds"

export function TimerSettings({ sound, onSoundChange, onClose }: {
    sound: string | null
    onSoundChange: (sound: string | null) => void
    onClose: () => void
}) {
    let option = (value: string, text: string, checked: boolean) => (
        <label key={value}>
            <input type="radio" name="sound" value={value} checked={checked}
                onChange={() => onSoundChange(value === "default" ? null : value)} />
            {text}
        </label>
    )

    return (
        <Dialog onClose={onClose}>
            <article data-box>
                <header>
                    <CloseButton />
                    <h2 className="inline">Options</h2>
                </header>
                <fieldset>
                    <legend>Sound</legend>
                    {option("default", "Default", sound == null)}
                    {soundOptions.map(([value, text]) => option(value, text, value === sound))}
                </fieldset>
            </article>
        </Dialog>
    )
}
