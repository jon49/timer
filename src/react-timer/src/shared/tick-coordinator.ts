class TickCoordinator {
    private intervalId: number | null = null
    private subscribers: (() => void)[] = []

    subscribe(subscriber: () => void) {
        this.subscribers.push(subscriber)
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.tick(), 1e3)
        }
    }

    unsubscribe(subscriber: (id: number) => void) {
        this.subscribers = this.subscribers.filter(s => s !== subscriber)
        if (!this.subscribers.length && this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
    }

    tick() {
        requestAnimationFrame(() => this.subscribers.forEach(subscriber => subscriber()))
    }
}

export let tickCoordinator = new TickCoordinator()
