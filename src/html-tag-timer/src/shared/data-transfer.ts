import { timerStore } from "./data-store"

export function downloadData() {
    let blob = new Blob([JSON.stringify(timerStore.data, null, 2)], { type: "application/json" })
    let url = URL.createObjectURL(blob)
    let $a = document.createElement("a")
    $a.href = url
    $a.download = "timers.json"
    $a.click()
    URL.revokeObjectURL(url)
}

export function uploadData() {
    let $input = document.createElement("input")
    $input.type = "file"
    $input.accept = "application/json,.json"
    $input.onchange = async () => {
        let file = $input.files?.[0]
        if (!file) return
        try {
            let data = JSON.parse(await file.text())
            if (data == null || typeof data !== "object" || !Array.isArray(data.timers)) {
                alert("Invalid timer data file.")
                return
            }
            timerStore.data = data
            timerStore.save()
            location.reload()
        } catch {
            alert("Could not read timer data file.")
        }
    }
    $input.click()
}
