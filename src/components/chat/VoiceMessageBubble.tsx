'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function formatTime(totalSeconds: number) {
	if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
	const m = Math.floor(totalSeconds / 60)
	const s = Math.floor(totalSeconds % 60)
	return `${m}:${String(s).padStart(2, '0')}`
}

// Chiều cao cố định cho waveform giả lập (không cần phân tích audio thật)
const BAR_HEIGHTS = [6, 12, 18, 10, 20, 14, 8, 16, 22, 12, 6, 18, 10, 20, 14, 8, 16, 12, 6, 18, 10, 14, 8, 12]

export default function VoiceMessageBubble({
	src,
	isMe,
}: {
	src: string
	isMe: boolean
}) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)
	const [duration, setDuration] = useState(0)
	const [currentTime, setCurrentTime] = useState(0)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onTime = () => setCurrentTime(audio.currentTime)
		const onLoaded = () => setDuration(audio.duration || 0)
		const onEnd = () => {
			setPlaying(false)
			setCurrentTime(0)
		}
		audio.addEventListener('timeupdate', onTime)
		audio.addEventListener('loadedmetadata', onLoaded)
		audio.addEventListener('ended', onEnd)
		return () => {
			audio.removeEventListener('timeupdate', onTime)
			audio.removeEventListener('loadedmetadata', onLoaded)
			audio.removeEventListener('ended', onEnd)
		}
	}, [])

	const toggle = () => {
		const audio = audioRef.current
		if (!audio) return
		if (playing) {
			audio.pause()
			setPlaying(false)
		} else {
			audio.play()
			setPlaying(true)
		}
	}

	const progress = duration > 0 ? currentTime / duration : 0
	const activeBars = Math.round(progress * BAR_HEIGHTS.length)
	const displaySeconds = currentTime > 0 ? currentTime : duration

	return (
		<div
			className={`flex w-[200px] max-w-full items-center gap-2.5 rounded-2xl px-3 py-2 ${isMe
				? 'bg-[#f4511e] text-white rounded-br-[3px]'
				: 'rounded-bl-[3px] bg-[#f1f4f5] text-[#082c40]'
				}`}
		>
			<audio ref={audioRef} src={src} preload="metadata" className="hidden" />
			<button
				onClick={toggle}
				aria-label={playing ? 'Tạm dừng' : 'Phát'}
				className={`flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full ${isMe ? 'bg-white/20' : 'bg-white'
					}`}
			>
				{playing ? (
					<Pause size={14} className={isMe ? 'text-white' : 'text-[#f4511e]'} fill="currentColor" />
				) : (
					<Play size={14} className={isMe ? 'text-white' : 'text-[#f4511e]'} fill="currentColor" />
				)}
			</button>
			<div className="flex h-6 flex-1 items-end gap-[2px] overflow-hidden">
				{BAR_HEIGHTS.map((height, i) => (
					<span
						key={i}
						className={`w-[2.5px] flex-none rounded-full ${i < activeBars
							? isMe ? 'bg-white' : 'bg-[#f4511e]'
							: isMe ? 'bg-white/35' : 'bg-[#d9dfe2]'
							}`}
						style={{ height: `${height}px` }}
					/>
				))}
			</div>
			<span className={`flex-none text-[10px] tabular-nums ${isMe ? 'text-white/85' : 'text-gray-500'}`}>
				{formatTime(displaySeconds)}
			</span>
		</div>
	)
}
