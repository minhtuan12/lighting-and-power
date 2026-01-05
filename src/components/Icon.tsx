import Image from 'next/image';

interface IconProps {
    src: string;
    size?: number;
    className?: string;
    alt?: string;
}

export function Icon({ src, size = 24, className = '', alt }: IconProps) {
    return (
        <Image
            src={src}
            width={size}
            height={size}
            alt={alt || src}
            className={`object-contain ${className}`}
        />
    );
}
