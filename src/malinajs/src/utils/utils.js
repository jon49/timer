export function formatTime(time, defaultValue = "") {
    if (!time) return defaultValue
    return ("" + time).padStart(2, "0")
}

export function formatClock(currentTime, startedTime, hours, minutes, seconds) {
    let totalTime = hours * 3600 + minutes * 60 + seconds
    let time = totalTime - (currentTime - startedTime)/1e3
    if (time < 1) return "00:00:00"
    let hours_ = Math.floor(time / 3600)
    let minutes_ = Math.floor((time % 3600) / 60)
    let seconds_ = Math.floor(time % 60)
    return `${formatTime(hours_, "00")}:${formatTime(minutes_, "00")}:${formatTime(seconds_, "00")}`
}