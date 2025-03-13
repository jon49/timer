import React, { useEffect, useRef } from "react"
import { publish } from "../shared/messaging"

export function Dialog({ children }: { children: any }) {
    let dialog = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        dialog?.current?.showModal()
    }, [])

    function handleClose(e: React.MouseEvent<HTMLDialogElement>) {
        e.stopPropagation()
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialog?.current?.close()
    }

    return (
        <dialog ref={dialog} onClick={handleClose} onClose={() => publish("dialogClosed")}>
            {children}
        </dialog>
    )
}