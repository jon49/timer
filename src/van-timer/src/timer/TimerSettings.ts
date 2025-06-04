import { timerStore } from "../shared/data-store";
import { soundOptions } from "../shared/sounds";
import { Dialog } from "../components/Dialog";
import van from "vanjs-core"

let { article, button, fieldset, form, h2, input, header, label, legend } = van.tags

export function TimerSettings(id: number) {
    let timer = timerStore.getTimer(id)

    return Dialog(
        article({ "data-box": "" },
            header(
                button({ form: "modalClose", ariaLabel: "Close", value: "cancel", rel: "prev" }),
                h2({ class: "inline" }, "Options"),
            ),
            fieldset({
                onchange: e => {
                    let value = e.target.value
                    timer.sound = value === "default" ? null : value
                    timerStore.updateTimer(timer)
                }
            },
                legend("Sound"),
                label(
                    input({ type: "radio", name: "sound", value: "default", checked: timer.sound == null }),
                    "Default"),
                soundOptions.map(([value, text]) =>
                    label(
                        input({ type: "radio", name: "sound", value, checked: value === timer.sound }),
                        text
                    )
                ),
            ),
        ),
        form({ id: "modalClose", method: "dialog" }),
    )
}
