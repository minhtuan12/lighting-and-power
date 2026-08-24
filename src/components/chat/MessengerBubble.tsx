'use client'

import JotaiProvider from '@/app/[locale]/(providers)/jotai-provider'
import QueryProvider from '@/app/[locale]/(providers)/query-provider'
import MessengerBubbleView from './MessengerBubbleView'
import MessengerPageView from './MessengerPageView'

export default function MessengerBubble() {
    return (
        <JotaiProvider>
            <QueryProvider>
                <MessengerBubbleView />
            </QueryProvider>
        </JotaiProvider>
    )
}

export function MessengerPage() {
    return (
        <JotaiProvider>
            <QueryProvider>
                <MessengerPageView />
            </QueryProvider>
        </JotaiProvider>
    )
}
