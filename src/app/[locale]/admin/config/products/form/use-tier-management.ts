import { useCallback, useState } from "react";

export function useTierManagement<T extends { [key: string]: any }>(
    initialState: T[] = []
) {
    const [tiers, setTiers] = useState<T[]>(initialState);
    const [newTier, setNewTier] = useState<Partial<T>>({} as Partial<T>);

    // Add tier với validation
    const handleAddTier = useCallback((validateFn?: (tier: Partial<T>) => boolean) => {
        const isValid = validateFn ? validateFn(newTier) : true;

        if (isValid) {
            setTiers(prev =>
                [...prev, newTier as T]
                    .sort((a, b) => a.minQuantity - b.minQuantity)
            );
            setNewTier({} as Partial<T>);
        }
    }, [newTier]);

    // Delete tier
    const handleDeleteTier = useCallback((index: number) => {
        setTiers(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Update specific field trong newTier
    const updateNewTierField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setNewTier(prev => ({ ...prev, [field]: value }));
    }, []);

    // Reset newTier
    const resetNewTier = useCallback(() => {
        setNewTier({} as Partial<T>);
    }, []);

    return {
        tiers,
        setTiers,
        newTier,
        setNewTier,
        handleAddTier,
        handleDeleteTier,
        updateNewTierField,
        resetNewTier
    };
}
