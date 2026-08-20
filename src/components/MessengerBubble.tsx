'use client'

import JotaiProvider from '@/app/[locale]/(providers)/jotai-provider'
import QueryProvider from '@/app/[locale]/(providers)/query-provider'
import { useAuth } from '@/hooks/use-me'
import { getSocket } from '@/lib/socket-client'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Flex, Input, Skeleton } from 'antd'
import { ArrowLeft, MessageCircle, Send, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

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
const timeLabel = (value?: string) =>
    value
        ? new Date(value).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        })
        : ''
const dayKey = (value: string) => new Date(value).toLocaleDateString('en-CA')
const dateLabel = (value: string) => {
    const date = new Date(value)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    if (dayKey(value) === dayKey(today.toISOString())) return 'Hôm nay'
    if (dayKey(value) === dayKey(yesterday.toISOString())) return 'Hôm qua'
    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function MessengerContent() {
    const locale = useLocale()
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<any>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [content, setContent] = useState('')
    const [error, setError] = useState('')
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const load = () =>
        user &&
        api('/api/social/conversations')
            .then(setConversations)
            .catch(() => undefined)

    useEffect(() => {
        const openForUser = (event: Event) => {
            const other = (event as CustomEvent).detail
            setError('')
            setOpen(true)
            api('/api/social/conversations', {
                method: 'POST',
                body: JSON.stringify({ userId: other._id }),
            })
                .then((conversation) => {
                    setConversations((current) =>
                        current.some((item) => item._id === conversation._id)
                            ? current
                            : [conversation, ...current],
                    )
                    setSelected({ ...conversation, other })
                })
                .catch((reason) => setError(reason.message))
        }
        window.addEventListener('messenger:open', openForUser)
        load()
        const socket = getSocket()
        const receive = (message: any) => {
            if (selected?._id === message.conversationId)
                setMessages((current) => [...current, message])
            load()
        }
        const receivePresence = (presence: { userIds?: string[] }) =>
            setOnlineUserIds(presence.userIds || [])
        socket?.on('message:new', receive)
        socket?.on('presence:update', receivePresence)
        if (socket?.connected) socket.emit('presence:request')
        return () => {
            window.removeEventListener('messenger:open', openForUser)
            socket?.off('message:new', receive)
            socket?.off('presence:update', receivePresence)
        }
    }, [user?._id, selected?._id])

    const [loadingMsg, setLoadingMsg] = useState(false)
    useEffect(() => {
        if (!selected) return
        setLoadingMsg(true)
        api(`/api/social/conversations/${selected._id}/messages`)
            .then(setMessages)
            .finally(() => {
                setLoadingMsg(false)
            })
        api(`/api/social/conversations/${selected._id}/messages`, {
            method: 'PATCH',
        }).then(load)
    }, [selected?._id])
    useEffect(() => {
        if (!selected || loadingMsg) return
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior: 'auto',
                block: 'end',
            })
        })
    }, [selected?._id, messages.length, loadingMsg])

    const unread = useMemo(
        () =>
            conversations.reduce(
                (total, item) => total + (item.unread || 0),
                0,
            ),
        [conversations],
    )
    const send = async () => {
        if (!selected || !content.trim()) return
        const message = await api(
            `/api/social/conversations/${selected._id}/messages`,
            { method: 'POST', body: JSON.stringify({ content }) },
        )
        setMessages((current) => [...current, message])
        setContent('')
        load()
    }
    if (!user) return null
    return (
        <>
            {!open && (
                <button
                    aria-label="Mở tin nhắn"
                    onClick={() => setOpen(true)}
                    className="cursor-pointer fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4511e] text-white shadow-xl transition-transform hover:scale-105"
                >
                    <MessageCircle size={24} />
                    {unread > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-xs font-bold">
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </button>
            )}
            {open && (
                <section className="fixed bottom-25 right-5 z-50 flex h-[430px] w-[335px] flex-col overflow-hidden rounded-lg border border-[#d9e2e8] bg-white shadow-xl">
                    <header className="flex items-center justify-between border-b border-[#e2e7eb] bg-white px-4 py-3 text-[#082c40]">
                        <strong>
                            {selected ? (
                                <Flex
                                    gap={12}
                                    align="center"
                                >
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="cursor-pointer flex items-center px-1 py-3 text-sm text-gray-500"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <Flex
                                        gap={12}
                                        align="center"
                                    >
                                        <span className="relative inline-flex">
                                            <Avatar
                                                size={40}
                                                src={selected.other.avatar}
                                                icon={<UserOutlined />}
                                            />
                                            {onlineUserIds.includes(
                                                String(selected.other._id),
                                            ) && (
                                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
                                                )}
                                        </span>
                                        {selected.other.fullName}
                                    </Flex>
                                </Flex>
                            ) : (
                                'Trò chuyện'
                            )}
                        </strong>
                        <button
                            onClick={() => {
                                setOpen(false)
                                setSelected(null)
                            }}
                            className="cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </header>
                    {error ? (
                        <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    ) : selected ? (
                        <>
                            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-white p-3">
                                {loadingMsg ? (
                                    <Skeleton />
                                ) : (
                                    messages.map((message, index) => {
                                        const showDate =
                                            index === 0 ||
                                            dayKey(
                                                messages[index - 1].createdAt,
                                            ) !== dayKey(message.createdAt)
                                        return (
                                            <Fragment key={message._id}>
                                                {showDate && (
                                                    <div className="pt-2 text-center text-[11px] font-medium text-gray-400">
                                                        {dateLabel(
                                                            message.createdAt,
                                                        )}
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${message.senderId === user._id ? 'ml-auto bg-[#f4511e] text-white rounded-br-[3px]' : 'rounded-bl-[3px] bg-[#f1f4f5] text-[#082c40]'}`}
                                                >
                                                    <div>{message.content}</div>
                                                    <small
                                                        className={`flex ${message.senderId === user._id ? 'justify-end' : ''} mt-1 block text-[10px] opacity-70`}
                                                    >
                                                        {timeLabel(
                                                            message.createdAt,
                                                        )}
                                                    </small>
                                                </div>
                                            </Fragment>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="flex gap-2 border-t border-[#dfe6ea] p-2">
                                <Input
                                    value={content}
                                    onChange={(event) =>
                                        setContent(event.target.value)
                                    }
                                    onPressEnter={send}
                                    placeholder="Nhập tin nhắn..."
                                    className="!h-[44px] !rounded-full !border-[#d9e2e8] !px-4"
                                />
                                <button
                                    onClick={send}
                                    className="cursor-pointer rounded-full bg-[#f4511e] px-3 text-white w-10 h-10 hover:opacity-90"
                                >
                                    <Send size={15} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto bg-white p-2">
                            {conversations.length ? (
                                conversations.map((conversation) => (
                                    <button
                                        key={conversation._id}
                                        onClick={() =>
                                            setSelected(conversation)
                                        }
                                        className="cursor-pointer flex w-full items-center gap-3 border-b border-[#edf0f2] px-2 py-3 text-left transition-colors hover:bg-[#f7f9fa]"
                                    >
                                        <div className="relative">
                                            <Avatar
                                                src={conversation.other?.avatar}
                                                icon={<UserOutlined />}
                                                size={40}
                                            />
                                            {onlineUserIds.includes(
                                                String(conversation.other._id),
                                            ) && (
                                                    <span className="absolute bottom-0 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
                                                )}
                                        </div>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate">
                                                {conversation.other?.fullName}
                                            </strong>
                                            <small className="block truncate text-gray-500">
                                                {conversation.latest?.content ||
                                                    'Bắt đầu trò chuyện'}
                                            </small>
                                        </span>
                                        <small className="self-start pt-1 text-xs text-gray-500">
                                            {timeLabel(
                                                conversation.latest?.createdAt,
                                            )}
                                        </small>
                                        {conversation.unread > 0 && (
                                            <b className="rounded-full bg-[#ff5a1f] px-2 py-1 text-xs text-white">
                                                {conversation.unread}
                                            </b>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="p-6 text-center text-sm text-gray-500">
                                    Chưa có cuộc trò chuyện
                                </p>
                            )}
                        </div>
                    )}
                </section>
            )}
        </>
    )
}

export default function MessengerBubble() {
    return (
        <JotaiProvider>
            <QueryProvider>
                <MessengerContent />
            </QueryProvider>
        </JotaiProvider>
    )
}
