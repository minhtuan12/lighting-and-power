import { useCallback, useState } from "react"

export function useTierManagement<T extends { [key: string]: any }>(
    initialState: T[] = [],
) {
    const [tiers, setTiers] = useState<T[]>(initialState)
    const [newTier, setNewTier] = useState<Partial<T>>({} as Partial<T>)

    const handleAddTier = useCallback(
        (validateFn?: (tier: Partial<T>) => boolean) => {
            const isValid = validateFn ? validateFn(newTier) : true

            if (isValid) {
                setTiers((prev) =>
                    [...prev, newTier as T].sort(
                        (a, b) => a.minQuantity - b.minQuantity,
                    ),
                )
                setNewTier({} as Partial<T>)
            }
        },
        [newTier],
    )

    const handleDeleteTier = useCallback((index: number) => {
        setTiers((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const updateNewTierField = useCallback(
        <K extends keyof T>(field: K, value: T[K]) => {
            setNewTier((prev) => ({ ...prev, [field]: value }))
        },
        [],
    )

    const resetNewTier = useCallback(() => {
        setNewTier({} as Partial<T>)
    }, [])

    return {
        tiers,
        setTiers,
        newTier,
        setNewTier,
        handleAddTier,
        handleDeleteTier,
        updateNewTierField,
        resetNewTier,
    }
}
