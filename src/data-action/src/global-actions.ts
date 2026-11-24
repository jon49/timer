import { timerStore } from "./shared/data-store.js"
import { downloadData, uploadData } from "./shared/data-transfer.js"
import { soundOptions } from "./shared/sounds.js"
import { cloneDialog, getXElements, showDialog } from "./shared/utils.js"
import { Timer } from "./Timer.js"

let w = window
let alarmSounds = soundOptions.slice(1)

let checkboxesHTML = alarmSounds.map(([value, text]) =>
  `<label><input type="checkbox" value="${value}" data-action="saveAllowedSounds">${text}</label>`).join("")

function openAppSettings() {
  let dialog = cloneDialog("appSettings")
  let $ = getXElements<{ $allowedSounds: HTMLFormElement, toggle: string }>(dialog)
  $.$allowedSounds.insertAdjacentHTML("beforeend", checkboxesHTML)
  let checkboxes = Array.from($.$allowedSounds.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))

  let show = () => {
    let allowed = timerStore.data.allowedSounds
    for (let input of checkboxes) input.checked = allowed.includes(input.value)
    $.toggle = allowed.length === alarmSounds.length ? "Deselect All" : "Select All"
  }
  show()

  showDialog(dialog, {
    saveAllowedSounds() {
      timerStore.setAllowedSounds(checkboxes.filter(x => x.checked).map(x => x.value))
      show()
    },
    toggleSounds() {
      let all = timerStore.data.allowedSounds.length === alarmSounds.length
      timerStore.setAllowedSounds(all ? [] : alarmSounds.map(([value]) => value))
      show()
    },
  })
}

w.app = {
  addTimer() {
    new Timer(timerStore.newTimer())
  },
  openAppSettings,
  downloadData,
  uploadData,
}

for (let timer of timerStore.data.timers) {
  new Timer(timer)
}
