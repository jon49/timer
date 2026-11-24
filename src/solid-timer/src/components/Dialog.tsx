import { onSettled, type ParentComponent } from "solid-js"

/** Native modal `<dialog>`; mount it to open, `onClose` fires when it closes. */
export const Dialog: ParentComponent<{ onClose: () => void }> = props => {
    let dialog!: HTMLDialogElement

    onSettled(() => dialog.showModal())

    function handleClick(e: MouseEvent) {
        // Clicks inside the content box are ignored; clicks on the backdrop close.
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialog.close()
    }

    return (
        <dialog ref={dialog} onClick={handleClick} onClose={() => props.onClose()}>
            {props.children}
            <form id="modalClose" class="inline" method="dialog" />
        </dialog>
    )
}

export function CloseButton() {
    return <button form="modalClose" aria-label="Close" value="cancel" {...{ rel: "prev" }} />
}
