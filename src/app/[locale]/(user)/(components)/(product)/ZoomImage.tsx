'use client'

import { useRef } from "react"


export default function ZoomImage({ src, title, className }: any) {
	const zoomImageRef = useRef<HTMLImageElement>(null)

	const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const img = zoomImageRef.current
		if (!img) return
		const rect = e.currentTarget.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100
		img.style.transformOrigin = `${x}% ${y}%`
	}

	return <div
		className="group col-span-5 relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#f8fafb] md:aspect-auto"
		onMouseMove={handleZoomMove}
	>
		<img
			ref={zoomImageRef}
			src={src}
			title={title}
			className={`${className} transition-transform duration-150 ease-out group-hover:scale-[2.2]`}
		/>
	</div>
}
