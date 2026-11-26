<script lang="ts">
    import { flushSync } from "svelte"
    import { formatClock } from "../shared/alarm"
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
    let editing = $state(false)
    let timeEntry: HTMLFieldSetElement

    // The time's inputs show while it's being edited, and while it's zero (as a
    // new timer's is), since there's nothing to show then. A running timer
    // keeps going; a new time is for its next start.
    let total = $derived(timer.hours * 3600 + timer.minutes * 60 + timer.seconds)
    let showEntry = $derived(editing || total === 0)

    function editTime() {
        flushSync(() => editing = true)
        timeEntry.querySelector("input")?.focus()
    }

    function leaveTimeEntry(e: FocusEvent & { currentTarget: HTMLFieldSetElement }) {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) editing = false
    }

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

<header class="timer-title">
    <label for={`timerTitle${id}`} aria-label="Timer Title">&#9998;</label>
    <input
        id={`timerTitle${id}`}
        class="plain"
        onchange={e => timer.title = e.currentTarget.value}
        value={timer.title}
        name="title"
        type="text"
        placeholder="Title">
    <button class="plain" onclick={onDelete} aria-label="Delete timer">❌</button>
</header>

<button class="plain time" onclick={editTime} title="Edit time" hidden={showEntry}>
    <span aria-hidden="true">&#9998;</span> {formatClock(total)}
</button>
<fieldset bind:this={timeEntry} class="nc-join time-entry" hidden={!showEntry}
    onfocusin={() => editing = true} onfocusout={leaveTimeEntry}>
    <input onchange={setValue("hours")} value={formatTime(timer.hours)} name="hours" type="number" placeholder="h">
    <input onchange={setValue("minutes")} value={formatTime(timer.minutes)} name="minutes" type="number" placeholder="m">
    <input onchange={setValue("seconds")} value={formatTime(timer.seconds)} name="seconds" type="number" placeholder="s">
</fieldset>

<div class="flex justify-between">
    <div class="flex">
        <CountDownTimer {id} sound={timer.sound} {startedAt} bind:timerState onStart={start} />
        <button onclick={start} hidden={timerState === "stopped"} aria-label="Restart">&#8635;</button>
        <button onclick={() => settingsOpen = true} aria-label="Timer options">&#9881;</button>
    </div>
    {#if settingsOpen}
        <TimerSettings bind:sound={timer.sound} onClose={() => settingsOpen = false} />
    {/if}
</div>
