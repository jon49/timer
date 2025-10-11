import van from "vanjs-core"
import type { State } from "vanjs-core"

export type DialogState = "opened" | "closing" | "closed"

let { dialog } = van.tags

export function Dialog(dialogState: State<DialogState>, ...children: HTMLElement[]) {
    let $dialog: HTMLDialogElement

    function handleClose(e: Event) {
        e.stopPropagation()
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialogState.val = "closing"
        setTimeout(() => $dialog?.close(), 1)
    }

    setTimeout(() => $dialog.showModal(), 1)

    return (
        $dialog = dialog({
            onclick: handleClose,
            onclose: () => dialogState.val === "closing" ? null : (dialogState.val = "closing"),
        }, children)
    )
}