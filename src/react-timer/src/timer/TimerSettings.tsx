import { timerStore } from "../shared/data-store";
import { soundOptions } from "../shared/sounds";
import { Dialog } from "../components/Dialog";

export function TimerSettings({ id }: { id: number }) {
    let timer = timerStore.getTimer(id)

    return (
        <Dialog>
            <article data-box>
                <header>
                    <button form="modalClose" aria-label="Close" value="cancel" rel="prev"></button>
                    <h2 className="inline">Options</h2>
                </header>
                <label>
                    Sound <br />
                    <select id="option-dialog" data-action="save" name="sound" onChange={e => {
                        timer.sound = e.target.value
                        timerStore.updateTimer(timer)
                    }}>
                        <option value="default" {...{ selected: timer.sound == null }}>Default</option>
                        {soundOptions.map(([value, text]) =>
                            <option value={value} {...{ selected: value === timer.sound }}>{text}</option>
                        )}
                    </select>
                </label>
            </article>
            <form id="modalClose" method="dialog"></form>
        </Dialog>
    )
}
