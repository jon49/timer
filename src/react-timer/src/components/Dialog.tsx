import { useEffect, useRef, type ReactNode } from "react"

/** Native modal `<dialog>`; mount it to open, `onClose` fires when it closes. */
export function Dialog({ onClose, children }: { onClose: () => void, children: ReactNode }) {
    let dialog = useRef<HTMLDialogElement>(null)
    let close = useRef(onClose)
    close.current = onClose

    useEffect(() => {
        let el = dialog.current!
        let handleClose = () => close.current()
        el.addEventListener("close", handleClose)
        el.showModal()
        return () => {
            el.removeEventListener("close", handleClose)
            if (el.open) el.close()
        }
    }, [])

    function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
        // Clicks inside the content box are ignored; clicks on the backdrop close.
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialog.current?.close()
    }

    return (
        <dialog ref={dialog} onClick={handleClick}>
            {children}
            <form id="modalClose" className="inline" method="dialog"></form>
        </dialog>
    )
}

export function CloseButton() {
    return <button form="modalClose" aria-label="Close" value="cancel" {...{ rel: "prev" }}></button>
}
