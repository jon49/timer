import van from "vanjs-core"
import { publish } from "../shared/messaging"

let { dialog } = van.tags

function publishClosing(dialogEl: HTMLDialogElement) {
    publish("dialogClosing", null, dialogEl)
}

export function Dialog(...children: HTMLElement[]) {
    let $dialog: HTMLDialogElement

    function handleClose(e: Event) {
        e.stopPropagation()
        if ((e.target as HTMLElement).closest("[data-box]")) return
        publishClosing($dialog as HTMLDialogElement)
        $dialog?.close()
    }

    setTimeout(() => $dialog.showModal(), 1)

    return (
        $dialog = dialog({
            onclick: handleClose,
            onclose: () => publishClosing($dialog),
        }, children)
    )
}