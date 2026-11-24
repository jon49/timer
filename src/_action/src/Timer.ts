import { formatClock, getAlarm, playAlarm } from "./shared/alarm.js"
import { timerStore } from "./shared/data-store.js"
import { soundOptions } from "./shared/sounds.js"
import { tickCoordinator } from "./shared/tick-coordinator.js"
import type { TimerData } from "./shared/types.js"
import { cloneDialog, formatTime, getXElements, showDialog, type TimerState } from "./shared/utils.js"

let w = window
let limits = { hours: 23, minutes: 59, seconds: 59 }

let soundRadiosHTML = [["default", "Default"], ...soundOptions].map(([value, text]) =>
  `<label><input type="radio" name="sound" value="${value}">${text}</label>`).join("")

export class Timer {
  id: number
  root: HTMLElement
  $: TimerElements
  state: TimerState = "stopped"
  startedAt = 0
  totalTime = 0
  clockTimeoutId = 0
  alarmTimeoutId = 0
  stopAudio = () => { }

  constructor(timer: TimerData) {
    let root = (w.timerTemplate.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement
    let $ = this.$ = getXElements<TimerElements>(root)
    this.id = timer.id

    $.$title.id = `timerTitle${timer.id}`
    $.$titleLabel.htmlFor = $.$title.id
    $.title = timer.title
    for (let name of ["hours", "minutes", "seconds"] as const) $[name] = formatTime(timer[name])

    this.root = root
    root.app = this
    w.timers.append(root)
  }

  get timer() {
    return timerStore.getTimer(this.id)
  }

  update(patch: Partial<TimerData>) {
    timerStore.updateTimer({ ...this.timer, ...patch })
  }

  saveTitle() {
    this.update({ title: this.$.title })
  }

  saveTime(e: Event) {
    let input = e.target as HTMLInputElement
    let name = input.name as keyof typeof limits
    let value = +input.value
    if (Number.isInteger(value) && value >= 0 && value <= limits[name]) {
      this.update({ [name]: value })
    }
    input.value = formatTime(this.timer[name])
  }

  openSettings() {
    let dialog = cloneDialog("timerSettings")
    let { $sounds } = getXElements<{ $sounds: HTMLFieldSetElement }>(dialog)
    $sounds.insertAdjacentHTML("beforeend", soundRadiosHTML)
    let sound = this.timer.sound ?? "default"
    for (let radio of $sounds.querySelectorAll<HTMLInputElement>("input")) {
      radio.checked = radio.value === sound
    }
    showDialog(dialog, this)
  }

  saveSound(e: Event) {
    let value = (e.target as HTMLInputElement).value
    this.update({ sound: value === "default" ? null : value })
  }

  deleteTimer() {
    this.stop()
    timerStore.deleteTimer(this.id)
    this.root.remove()
  }

  toggleTimerState() {
    if (this.state === "stopped") {
      this.start()
    } else {
      this.stop()
    }
  }

  // Also restarts a running or ringing timer.
  start() {
    this.clear()
    let $ = this.$
    this.state = "running"
    this.startedAt = Math.floor(Date.now() / 1e3)
    this.totalTime = timerStore.getTotalTime(this.id)
    $.clock = formatClock(this.totalTime)
    $.$clock.title = "Click to stop."
    $.$clock.ariaLabel = "Click to stop."
    $.$restart.hidden = false
    tickCoordinator.subscribe(this)
    this.clockTimeoutId = setTimeout(() => this.startAlarm(), this.totalTime * 1e3)
  }

  stop() {
    this.clear()
    let $ = this.$
    this.state = "stopped"
    $.clock = "Start"
    $.$clock.title = "Click to stop."
    $.$clock.ariaLabel = "Click to start."
    $.$restart.hidden = true
  }

  clear() {
    tickCoordinator.unsubscribe(this)
    clearTimeout(this.clockTimeoutId)
    clearTimeout(this.alarmTimeoutId)
    this.stopAudio()
    this.stopAudio = () => { }
  }

  startAlarm() {
    this.clear()
    let $ = this.$
    this.state = "alarm"
    $.clock = "Stop"
    $.$clock.ariaLabel = "Click to start."
    $.$clock.focus()

    let sound = getAlarm(this.timer.sound, timerStore.data.allowedSounds)
    if (!sound) return
    $.$clock.title = sound.title
    this.stopAudio = playAlarm($.$audio, sound)
    // Stop the alarm after 2 minutes.
    this.alarmTimeoutId = setTimeout(() => this.stop(), 12e4)
  }

  tick(now: number) {
    this.$.clock = formatClock(this.totalTime - (now - this.startedAt))
  }
}

interface TimerElements {
  title: string
  $title: HTMLInputElement
  $titleLabel: HTMLLabelElement
  hours: number | string
  minutes: number | string
  seconds: number | string
  clock: string
  $clock: HTMLButtonElement
  $restart: HTMLButtonElement
  $audio: HTMLAudioElement
}
