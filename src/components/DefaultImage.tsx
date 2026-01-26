import Image from "next/image";

export default function DefaultImage(
    { title, src, className = '', }:
        { title?: string, src: string, className?: string; }
) {
    return <div className={`relative w-20 h-20 ${className} border-[#B7B7B7] border rounded-[10px]`}>
        <Image
            alt={title ?? ''}
            src={src}
            className='w-full h-full absolute rounded-[10px]'
            fill
            objectFit='cover'
            loading="lazy"
        />
    </div>
}
