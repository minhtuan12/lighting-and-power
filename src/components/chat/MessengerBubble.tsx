'use client'

import { CallProvider } from '@/hooks/use-call'
import { CallScreen } from '../call/CallScreen'
import { IncomingCallModal } from '../call/IncomingCallModel'
import MessengerBubbleView from './MessengerBubbleView'
import MessengerPageView from './MessengerPageView'

export default function MessengerBubble() {
    return (
        <MessengerBubbleView />
    )
}

export function MessengerPage() {
    return (
        <CallProvider>
            <MessengerPageView />
            <IncomingCallModal />
            <CallScreen />
        </CallProvider>
    )
}
