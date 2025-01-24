// PicoCSS Modal
class xModal extends HTMLElement {
    /** @type {HTMLElement} */
    html
    animation = 400
    /** @type {MutationObserver|undefined} */
    observer
    /** @type {HTMLDialogElement|undefined} */
    dialog
    /** @type {HTMLElement|null} */
    box
    constructor() {
        super()
        this.html = document.documentElement
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
        this.html.classList.add('modal-is-open', 'modal-is-opening')
        this.dialog = this.querySelector('dialog')
        this.dialog.showModal()
        setTimeout(() => {
            this.html.classList.remove('modal-is-opening')
        }, this.animation)
        this.dialog.addEventListener('close', this)
        this.dialog.addEventListener('click', this)
        this.box = this.dialog.querySelector("[box]")
        this.addEventListener('hf:completed', this)
    }

    /** @param {Event} event */
    handleEvent(event) {
        handleEvent(this, event)
    }

    close() {
        this.handleclose()
    }

    "handlehf:completed"() {
        this.handleclose()
    }

    handleclose() {
        this.html.classList.add('modal-is-closing')
        setTimeout(() => {
            this.html.classList.remove('modal-is-open', 'modal-is-closing')
            this.dialog?.close()
            this.remove()
        }, this.animation)
    }

    /** @param {MouseEvent} e */
    handleclick(e) {
        if (!this.dialog?.open) {
            return
        }

        if (e.target instanceof HTMLButtonElement
            && e.target.value === 'cancel'
        ) {
            this.handleclose()
        }

        if (this.box?.contains(e.target)) {
            return
        }

        this.handleclose()
    }

}

window.customElements.define('x-modal', xModal)

/**
 * @param {HTMLElement} context 
 * @param {Event} event 
 */
function handleEvent(context, event) {
    let target = event.target
    let targetAttribute = `x-${event.type}`
    if (target instanceof HTMLElement) {
        let targetQuery = `[${targetAttribute}]`
        let action
        try {
            /** @type {string | undefined | null} */
            action =
                target.querySelector(targetQuery)?.getAttribute(targetAttribute)
                || target.closest(targetQuery)?.getAttribute(targetAttribute)
        } catch (_) { }

        if (action) {
            if ((context)[action] instanceof Function) {
                stopEvent(event)
                // @ts-ignore
                context[action](event)
            } else {
                console.warn(`Action ${action} not implemented.`)
            }
        } else if ((context)[`handle${event.type}`] instanceof Function) {
            (context)[`handle${event.type}`](event)
        }
    }
}
