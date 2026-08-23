import React from 'react'

export default function ChatAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div className="min-h-screen bg-[#f5f8fa] px-1 py-1">{children}</div>
}
