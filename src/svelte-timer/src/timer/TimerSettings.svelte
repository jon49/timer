<script lang="ts">
    import Dialog from "../components/Dialog.svelte"
    import { soundOptions } from "../shared/sounds"

    let { sound = $bindable(), onClose }: { sound: string | null, onClose: () => void } = $props()

    function handleChange(e: Event) {
        let value = (e.target as HTMLInputElement).value
        sound = value === "default" ? null : value
    }
</script>

<Dialog {onClose}>
    <article data-box>
        <header>
            <button form="modalClose" aria-label="Close" value="cancel" {...{ rel: "prev" }}></button>
            <h2 class="inline">Options</h2>
        </header>
        <fieldset onchange={handleChange}>
            <legend>Sound</legend>
            <label>
                <input type="radio" name="sound" value="default" checked={sound == null}>
                Default
            </label>
            {#each soundOptions as [value, text] (value)}
                <label>
                    <input type="radio" name="sound" {value} checked={value === sound}>
                    {text}
                </label>
            {/each}
        </fieldset>
    </article>
</Dialog>
