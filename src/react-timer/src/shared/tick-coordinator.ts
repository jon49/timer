class TickCoordinator {
    private intervalId: number | null = null
    private subscribers: Map<number, () => void> = new Map

    subscribe(id: number, subscriber: () => void) {
        this.subscribers.set(id, subscriber)
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.tick(), 1e3)
        }
    }

    unsubscribe(id: number) {
        this.subscribers.delete(id)
        if (this.subscribers.size === 0 && this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
    }

    tick() {
        requestAnimationFrame(() => this.subscribers.forEach(subscriber => subscriber()))
    }
}

export let tickCoordinator = new TickCoordinator()
