import { timerStore } from "./shared/data-store.js"
import { downloadData, uploadData } from "./shared/data-transfer.js"
import { soundOptions } from "./shared/sounds.js"
import { closeOnBackdrop } from "./shared/utils.js"
import { Timer } from "./Timer.js"

let w = window
let alarmSounds = soundOptions.slice(1)

let $appSettings = document.getElementById("appSettings") as HTMLDialogElement
let $allowedSounds = document.getElementById("allowedSounds") as HTMLFormElement
let $toggleSounds = document.getElementById("toggleSounds") as HTMLButtonElement

for (let [value, text] of alarmSounds) {
  $allowedSounds.insertAdjacentHTML("beforeend",
    `<label><input type="checkbox" value="${value}" data-action="saveAllowedSounds">${text}</label>`)
}
closeOnBackdrop($appSettings)

let checkboxes = () => Array.from($allowedSounds.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))

function showAllowedSounds() {
  let allowed = timerStore.data.allowedSounds
  for (let input of checkboxes()) input.checked = allowed.includes(input.value)
  $toggleSounds.textContent = allowed.length === alarmSounds.length ? "Deselect All" : "Select All"
}

w.app = {
  addTimer() {
    new Timer(timerStore.newTimer())
  },
  openAppSettings() {
    showAllowedSounds()
    $appSettings.showModal()
  },
  saveAllowedSounds() {
    timerStore.setAllowedSounds(checkboxes().filter(x => x.checked).map(x => x.value))
    showAllowedSounds()
  },
  toggleSounds() {
    let all = timerStore.data.allowedSounds.length === alarmSounds.length
    timerStore.setAllowedSounds(all ? [] : alarmSounds.map(([value]) => value))
    showAllowedSounds()
  },
  downloadData,
  uploadData,
}

for (let timer of timerStore.data.timers) {
  new Timer(timer)
}
