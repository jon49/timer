// @ts-check
(() => {
class XDialog extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        if (this.children.length) {
            this.init()
            return
        }

        // not yet available, watch it for _init
        this.observer = new MutationObserver(this.init.bind(this))
        this.observer.observe(this, { childList: true })
    }

    init() {
        this.observer?.disconnect()
        this.observer = null

        this.dialog = this.querySelector("dialog")
        if (!(this.dialog instanceof HTMLDialogElement)) return

        this.dialog.showModal()

        this.hasDisposed = false
        let closeEvent = this.closeEvent = this.getAttribute("close-event")
        if (closeEvent) {
            this.addEventListener(closeEvent, this)
        }
        this.addEventListener("close", this)
        this.addEventListener("click", this)
    }

    /** @param {Event} e */
    handleEvent(e) {
        if (e.type === this.closeEvent) {
            this.dialog?.close()
            this.remove()
            return
        }
        this[`handle${e.type}`](e)
    }

    /** @param {MouseEvent} e */
    handleclick(e) {
        if (this.dialog?.open) {
            const dialogDimensions = this.dialog.getBoundingClientRect()
            if (!(e.target instanceof HTMLDialogElement) && e.target instanceof HTMLElement) {
                if (e.target.closest("dialog") === this.dialog) return
            }
            if (  e.clientX < dialogDimensions.left
               || e.clientX > dialogDimensions.right
               || e.clientY < dialogDimensions.top
               || e.clientY > dialogDimensions.bottom ) {
                this.dialog.close()
                this.remove()
            }
        }
    }

    handleclose() {
        this.remove()
    }
}

customElements.define("x-dialog", XDialog)

})()

