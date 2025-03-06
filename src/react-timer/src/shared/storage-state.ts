import { useEffect, useState } from "react"

export function useStorageState<T extends string,>({ key, initialState }: { key: string, initialState: T }) {
    const state = useState(localStorage.getItem(key) ?? initialState)

    let value = state[0]
    useEffect(() => {
        localStorage.setItem(key, value)
    }, [value])

    return state
}
