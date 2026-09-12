'use client'

import { useCall } from '@/hooks/use-call';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

function VideoTile({ stream, name }: { stream: MediaStream | null; name?: string }) {
	const ref = useRef<HTMLVideoElement>(null)
	useEffect(() => {
		if (ref.current) ref.current.srcObject = stream
	}, [stream])
	return (
		<div className="relative h-full min-h-0 w-full overflow-hidden rounded-lg bg-gray-800"> {/* + min-h-0 */}
			<video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />
			{name && (
				<span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
					{name}
				</span>
			)}
		</div>
	)
}

export function CallScreen() {
	const { status, callType, participants, localStream, isMicOn, isCameraOn, toggleMic, toggleCamera, endCall } =
		useCall()

	const peerList = Object.values(participants)

	if (status !== 'connecting' && status !== 'in-call') return null

	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden bg-gray-900 z-[99999999999]"> {/* + overflow-hidden */}
			{callType === 'audio' &&
				peerList.map((peer) => (
					<audio
						key={peer.userId}
						autoPlay
						ref={(el) => {
							if (el) el.srcObject = peer.stream
						}}
					/>
				))}

			<div className="relative min-h-0 flex-1 p-2"> {/* + min-h-0 */}
				{callType === 'video' ? (
					<div
						className={`grid h-full min-h-0 auto-rows-fr gap-2 ${peerList.length <= 1 ? 'grid-cols-1' : peerList.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
							}`}
					/* + min-h-0 auto-rows-fr */
					>
						{peerList.map((peer) => (
							<VideoTile key={peer.userId} stream={peer.stream} name={peer.fullName || peer.userId} />
						))}
					</div>
				) : (
					<div className="flex h-full flex-wrap items-center justify-center gap-6 text-white">
						{peerList.map((peer) => (
							<div key={peer.userId} className="flex flex-col items-center">
								<div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700 text-3xl">
									{(peer.fullName || peer.userId)?.[0]?.toUpperCase()}
								</div>
								<p className="text-sm font-medium">{peer.fullName || peer.userId}</p>
							</div>
						))}
						<p className="w-full text-center text-sm text-gray-400">
							{status === 'connecting' ? 'Đang kết nối...' : 'Đang trong cuộc gọi'}
						</p>
					</div>
				)}

				{callType === 'video' && (
					<video
						autoPlay
						playsInline
						muted
						ref={(el) => {
							if (el) el.srcObject = localStream
						}}
						className="absolute bottom-24 right-4 h-32 w-24 rounded-lg border border-white/20 object-cover shadow-lg"
					/>
				)}
			</div>

			<div className="flex items-center justify-center gap-6 bg-gray-900/90 py-6">
				<button onClick={toggleMic} className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600">
					{isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
				</button>
				{callType === 'video' && (
					<button onClick={toggleCamera} className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600">
						{isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
					</button>
				)}
				<button onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
					<PhoneOff className="h-6 w-6" />
				</button>
			</div>
		</div>
	)
}
