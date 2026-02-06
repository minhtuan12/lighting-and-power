"use client"

import { useEffect, useRef, useState } from "react"
import { Icon } from "./Icon"

// Define base interface cho items phải có
interface CarouselItem {
    _id?: string
    name?: string
    slug?: string
    images?: string[]
    description?: string
    price?: number
    stock?: number
}

// Generic component với type T extends CarouselItem
interface CategoryCarouselProps<T = any> {
    items: T[]
    pathToRedirect?: string
    className?: string
    children: React.ReactNode
}

export default function Carousel<T extends CarouselItem = any>({
    items,
    pathToRedirect = "",
    className = "",
    children,
}: CategoryCarouselProps<T>) {
    const scrollRef = useRef<HTMLElement>(null)
    const [needsScroll, setNeedsScroll] = useState(false)

    useEffect(() => {
        // Check nếu content width > container width thì cần scroll
        if (scrollRef.current) {
            const hasOverflow =
                scrollRef.current.scrollWidth > scrollRef.current.clientWidth
            setNeedsScroll(hasOverflow)
        }
    }, [items])

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            })
        }
    }

    return (
        <section aria-label="Items" className="mx-auto w-full">
            <div style={{ position: "relative" }}>
                {/* Left Arrow */}
                {needsScroll && (
                    <Icon
                        onClick={() => scroll("left")}
                        src="/images/right-carousel-arrow.png"
                        size={20}
                        className="absolute -left-13 cursor-pointer top-1/2 -translate-y-1/2 rotate-[180deg]"
                    />
                )}

                {/* items Container */}
                <nav
                    ref={scrollRef}
                    className={`grid grid-flow-col auto-cols-[215px] gap-4 overflow-x-auto py-[10px] relative w-full ${needsScroll ? "justify-start" : "justify-center"} ${className}`}
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    <style>
                        {`
                            nav::-webkit-scrollbar {
                                display: none;
                            }
                        `}
                    </style>

                    {children}
                </nav>

                {/* Right Arrow */}
                {needsScroll && (
                    <Icon
                        onClick={() => scroll("right")}
                        src="/images/right-carousel-arrow.png"
                        size={20}
                        className="absolute -right-13 cursor-pointer top-1/2 -translate-y-1/2"
                    />
                )}
            </div>

            {/* SEO: Hidden list for crawlers */}
            <div style={{ display: "none" }}>
                <ul>
                    {items.map((item) => (
                        <li key={item._id}>
                            <a href={`${pathToRedirect}/${item.slug}`}>
                                {item.name}{" "}
                                {item.description && `- ${item.description}`}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
