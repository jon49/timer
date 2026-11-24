<script lang="ts">
    import type { Snippet } from "svelte"

    let { onClose, children }: { onClose: () => void, children: Snippet } = $props()

    let dialog: HTMLDialogElement

    $effect(() => {
        dialog.showModal()
    })

    function handleClick(e: MouseEvent) {
        e.stopPropagation()
        // Clicks inside the content box are ignored; clicks on the backdrop close.
        if ((e.target as HTMLElement).closest("[data-box]")) return
        dialog.close()
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} onclick={handleClick} onclose={onClose}>
    {@render children()}
    <form id="modalClose" class="inline" method="dialog"></form>
</dialog>
