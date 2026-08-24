import React from 'react'

export default function ChatAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div className="min-h-screen max-h-screen w-screen">{children}</div>
}
