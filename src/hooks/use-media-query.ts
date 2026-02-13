"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)
        
        // Set initial value
        if (media.matches !== matches) {
            setMatches(media.matches)
        }

        // Listen for changes
        const listener = () => setMatches(media.matches)
        media.addEventListener("change", listener)

        return () => media.removeEventListener("change", listener)
    }, [matches, query])

    return matches
}

// Tailwind breakpoints helpers
export function useIsMobile() {
    return useMediaQuery("(max-width: 640px)") // sm
}

export function useIsTablet() {
    return useMediaQuery("(min-width: 641px) and (max-width: 1024px)") // md to lg
}

export function useIsDesktop() {
    return useMediaQuery("(min-width: 1025px)") // lg+
}

export function useIsSmallScreen() {
    return useMediaQuery("(max-width: 768px)") // md
}

export function useIsMediumScreen() {
    return useMediaQuery("(min-width: 769px) and (max-width: 1280px)") // md to xl
}

export function useIsLargeScreen() {
    return useMediaQuery("(min-width: 1281px)") // xl+
}
