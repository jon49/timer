interface Tick {
  tick: (currentTime: number) => void
}

class TickCoordinator {
  private intervalId: number | null = null
  private subscribers: Set<Tick> = new Set() // Map<number, { tick: (currentTime: number) => void }> = new Map

  subscribe(subscriber: Tick) {
    this.subscribers.add(subscriber)
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), 1e3)
    }
  }

  unsubscribe(val: Tick) {
    this.subscribers.delete(val)
    if (this.subscribers.size === 0 && this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  tick() {
    requestAnimationFrame(() => {
      let now = (Date.now() / 1e3) | 0
      for (let subscriber of this.subscribers) {
        subscriber.tick(now)
      }
    })
  }
}

export let tickCoordinator = new TickCoordinator()
