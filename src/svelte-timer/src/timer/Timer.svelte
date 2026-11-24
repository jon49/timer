<script lang="ts">
    import { timerStore } from "../shared/data-store"
    import { formatTime, type TimerState } from "../shared/utils"
    import CountDownTimer from "./CountDownTimer.svelte"
    import TimerSettings from "./TimerSettings.svelte"

    let { id, onDelete }: { id: number, onDelete: () => void } = $props()

    // `id` is fixed for the life of this component (the list is keyed by it).
    // svelte-ignore state_referenced_locally
    let timer = $state(timerStore.getTimer(id))
    let timerState = $state<TimerState>("stopped")
    let startedAt = $state(0)
    let settingsOpen = $state(false)

    $effect(() => {
        timerStore.updateTimer($state.snapshot(timer))
    })

    function start() {
        startedAt = Date.now()
        timerState = "running"
    }

    let limits = { hours: 23, minutes: 59, seconds: 59 }

    function setValue(name: keyof typeof limits) {
        return (e: Event) => {
            let input = e.currentTarget as HTMLInputElement
            let value = +input.value
            if (!Number.isInteger(value) || value < 0 || value > limits[name]) {
                input.value = formatTime(timer[name])
                return
            }
            timer[name] = value
        }
    }
</script>

<header class="pb-0">
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <fieldset role="group">
        <input
            id={`timerTitle${id}`}
            class="plain"
            onchange={e => timer.title = e.currentTarget.value}
            value={timer.title}
            name="title"
            type="text"
            placeholder="Title">
        <label for={`timerTitle${id}`} aria-label="Timer Title">&#9998;</label>
    </fieldset>
</header>

<!-- svelte-ignore a11y_no_redundant_roles -->

<fieldset role="group">
    <input onchange={setValue("hours")} value={formatTime(timer.hours)} name="hours" type="number" placeholder="h">
    <input onchange={setValue("minutes")} value={formatTime(timer.minutes)} name="minutes" type="number" placeholder="m">
    <input onchange={setValue("seconds")} value={formatTime(timer.seconds)} name="seconds" type="number" placeholder="s">
</fieldset>

<div class="flex justify-between">
    <div class="flex">
        <CountDownTimer {id} sound={timer.sound} {startedAt} bind:timerState onStart={start} />
        <button onclick={start} hidden={timerState === "stopped"} aria-label="Restart">&#8635;</button>
        <button onclick={() => settingsOpen = true} aria-label="Timer options">&#9881;</button>
        <button onclick={onDelete} aria-label="Delete timer">❌</button>
    </div>
    {#if settingsOpen}
        <TimerSettings bind:sound={timer.sound} onClose={() => settingsOpen = false} />
    {/if}
</div>
