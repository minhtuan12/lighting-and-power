import Image from "next/image"
import { HTMLAttributes } from "react"

interface IconProps extends HTMLAttributes<HTMLDivElement> {
    src: string
    size?: number
    className?: string
    alt?: string
}

export function Icon({
    src,
    size = 24,
    className = "",
    alt,
    ...divProps
}: IconProps) {
    return (
        <Image
            src={src}
            width={size}
            height={size}
            alt={alt || src}
            className={`object-contain ${className}`}
            {...divProps}
        />
    )
}
