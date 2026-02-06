"use client"

import { ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"

export default function GoToTopButton() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            setVisible(window.scrollY > 300)
        }

        window.addEventListener("scroll", toggleVisibility)
        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <button
            onClick={scrollToTop}
            className={`cursor-pointer fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll to top"
        >
            <ChevronUp className="w-5 h-5" />
        </button>
    )
}
