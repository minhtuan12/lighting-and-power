'use client'

import { getSocket } from '@/lib/socket-client'
import { Badge } from 'antd'
import { Bell, Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const api = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    })
    const body = await response.json()
    if (!response.ok || body.success === false)
        throw new Error(body.message || 'Request failed')
    return body.data
}

export default function NotificationBell() {
    const t = useTranslations('notifications')
    const locale = useLocale()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [data, setData] = useState<{ notifications: any[]; unread: number }>({
        notifications: [],
        unread: 0,
    })
    const containerRef = useRef<HTMLDivElement>(null)
    const load = () =>
        api('/api/notifications')
            .then(setData)
            .catch(() => undefined)
    useEffect(() => {
        load()
        const socket = getSocket()
        const receive = (notification: any) => setData((current) => ({ notifications: [notification, ...current.notifications], unread: current.unread + 1 }))
        socket?.on('notification:new', receive)
        return () => { socket?.off('notification:new', receive) }
    }, [])
    useEffect(() => {
        if (!open) return
        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [open])
    const click = async (item: any) => {
        if (!item.readAt) {
            await api(`/api/notifications/${item._id}`, { method: 'PATCH' })
            setData((current) => ({
                ...current,
                unread: Math.max(0, current.unread - 1),
                notifications: current.notifications.map((notification) =>
                    notification._id === item._id
                        ? { ...notification, readAt: new Date().toISOString() }
                        : notification,
                ),
            }))
        }
        if (item.link) router.push(`/${locale}${item.link}`)
    }
    return (
        <div ref={containerRef} className="relative">
            <button
                aria-label={t('title')}
                onClick={() => setOpen((value) => !value)}
                className="cursor-pointer relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
                <Badge
                    count={data.unread}
                    overflowCount={99}
                    offset={[-2, 2]}
                    size="small"
                >
                    <Bell size={24} color='white' />
                </Badge>
            </button>
            {open && (
                <div className="absolute -right-15 md:right-0 top-12 z-[1000] w-[360px] overflow-hidden rounded-md border border-[#e2e6f0] bg-white text-slate-800 shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <strong>{t('title')}</strong>
                        {data.unread > 0 && (
                            <span className="text-xs text-[var(--primary)]">
                                {t('unread', { count: data.unread })}
                            </span>
                        )}
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                        {data.notifications.length ? (
                            data.notifications.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => click(item)}
                                    className={`cursor-pointer flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-[#f7f8fc] ${item.readAt ? 'bg-white' : 'bg-[#eef2ff]'}`}
                                >
                                    <span
                                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? 'bg-slate-200' : 'bg-[#ff5a1f]'}`}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <strong className="block text-sm">
                                            {item.title}
                                        </strong>
                                        <span className="block text-sm text-slate-600">
                                            {item.message}
                                        </span>
                                        <small className="text-xs text-slate-400">
                                            {new Date(
                                                item.createdAt,
                                            ).toLocaleString(locale, {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour12: false,
                                            })}
                                        </small>
                                    </span>
                                    {item.readAt && (
                                        <Check
                                            size={15}
                                            className="mt-1 text-slate-300"
                                        />
                                    )}
                                </button>
                            ))
                        ) : (
                            <p className="p-8 text-center text-sm text-slate-500">
                                {t('empty')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
