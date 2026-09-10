'use client'

import { useCall } from '@/hooks/use-call'
import { Phone, PhoneOff, Video } from 'lucide-react'

export function IncomingCallModal() {
	const { status, callType, participants, isGroup, acceptCall, rejectCall, endCall } = useCall()

	if (status !== 'incoming' && status !== 'outgoing') return null

	const isIncoming = status === 'incoming'
	const names = Object.values(participants)
		.map((p) => p.fullName || p.userId)
		.join(', ')

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-80 rounded-2xl bg-white p-6 text-center shadow-xl">
				<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
					{callType === 'video' ? (
						<Video className="h-8 w-8 text-gray-600" />
					) : (
						<Phone className="h-8 w-8 text-gray-600" />
					)}
				</div>

				<p className="text-sm text-gray-500">
					{isIncoming
						? `${callType === 'video' ? 'Video call' : 'Cuộc gọi'}${isGroup ? ' nhóm' : ''} đến`
						: isGroup
							? 'Đang gọi nhóm...'
							: 'Đang gọi...'}
				</p>
				<p className="mt-1 text-lg font-semibold text-gray-900">{names || '...'}</p>

				<div className="mt-6 flex justify-center gap-4">
					{isIncoming ? (
						<>
							<button
								onClick={rejectCall}
								className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
							>
								<PhoneOff className="h-6 w-6" />
							</button>
							<button
								onClick={acceptCall}
								className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
							>
								<Phone className="h-6 w-6" />
							</button>
						</>
					) : (
						<button
							onClick={endCall}
							className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
						>
							<PhoneOff className="h-6 w-6" />
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
