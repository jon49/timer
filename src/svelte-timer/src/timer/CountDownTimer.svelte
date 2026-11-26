<script lang="ts">
    import { untrack } from "svelte"
    import { getAlarm, playAlarm } from "../shared/alarm"
    import { timerStore } from "../shared/data-store"
    import { tickCoordinator } from "../shared/tick-coordinator"
    import type { TimerState } from "../shared/utils"

    let {
        id,
        sound,
        startedAt,
        timerState = $bindable(),
        timeLeft = $bindable(),
        onStart,
    }: {
        id: number
        sound: string | null
        startedAt: number
        timerState: TimerState
        timeLeft: number
        onStart: () => void
    } = $props()

    let button: HTMLButtonElement
    let alarmTitle = $state("")

    // Running: count down from the wall clock. Re-runs when restarted
    // (`startedAt` changes); the cleanup runs on stop, alarm, or unmount.
    $effect(() => {
        if (timerState !== "running") return
        let start = Math.floor(startedAt / 1e3)
        let total = timerStore.getTotalTime(id)
        timeLeft = total
        tickCoordinator.subscribe(id, now => timeLeft = total - (now - start))
        let timeout = setTimeout(() => timerState = "alarm", total * 1e3)
        return () => {
            tickCoordinator.unsubscribe(id)
            clearTimeout(timeout)
        }
    })

    // Alarm: play the sound, auto-stop after 2 minutes.
    $effect(() => {
        if (timerState !== "alarm") return
        // With the focus ring, even after a mouse click (a plain focus() has none
        // then). Blurred first, since focusing the button that already has the
        // focus (Start was clicked) changes nothing.
        button.blur()
        button.focus({ focusVisible: true })
        let soundInfo = getAlarm(untrack(() => sound), timerStore.data.allowedSounds)
        if (!soundInfo) return
        alarmTitle = soundInfo.title
        let stopAudio = playAlarm(new Audio(), soundInfo)
        let autoStop = setTimeout(() => timerState = "stopped", 12e4)
        return () => {
            clearTimeout(autoStop)
            stopAudio()
        }
    })

    function toggle() {
        if (timerState === "stopped") {
            onStart()
        } else {
            timerState = "stopped"
        }
    }
</script>

<button
    bind:this={button}
    class="clock"
    onclick={toggle}
    style="width: 140px"
    title={timerState === "alarm" ? alarmTitle : "Click to stop."}
    aria-label={timerState === "running" ? "Click to stop." : "Click to start."}>
    {timerState === "stopped" ? "Start" : "Stop"}
</button>
