<script lang="ts">
    import Dialog from "../components/Dialog.svelte"
    import { timerStore } from "../shared/data-store"
    import { soundOptions } from "../shared/sounds"

    let alarmSounds = soundOptions.slice(1)
    let open = $state(false)
    let allowedSounds = $state(timerStore.data.allowedSounds)
    let allSelected = $derived(allowedSounds.length === alarmSounds.length)

    $effect(() => {
        timerStore.setAllowedSounds($state.snapshot(allowedSounds))
    })

    function toggleAll(e: Event) {
        e.preventDefault()
        allowedSounds = allSelected ? [] : alarmSounds.map(([value]) => value)
    }
</script>

<button onclick={() => open = true} aria-label="Options for all timers">&#9881;</button>

{#if open}
    <Dialog onClose={() => open = false}>
        <article id="app-settings-edit" data-box>
            <header>
                <button form="modalClose" aria-label="Close" value="cancel" {...{ rel: "prev" }}></button>
                <h2 class="inline">Options for All Timers</h2>
            </header>
            <h3>Allowed Sounds</h3>
            <form>
                <button onclick={toggleAll}>{allSelected ? "Deselect All" : "Select All"}</button>
                <hr>
                {#each alarmSounds as [value, text] (value)}
                    <label>
                        <input type="checkbox" {value} bind:group={allowedSounds}>
                        {text}
                    </label>
                {/each}
            </form>
        </article>
    </Dialog>
{/if}
