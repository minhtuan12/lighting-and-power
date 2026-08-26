'use client'

import RichTextContent from '@/components/RichTextContent'
import { useAuth } from '@/hooks/use-me'
import { getSocket } from '@/lib/socket-client'
import { Avatar, Button, Flex, Skeleton, Tag, Typography } from 'antd'
import {
    ArrowLeft,
    Mail,
    MessageCircle,
    Phone,
    UserPlus,
    UserRound,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

function MemberProfileContent({ params }: { params: Promise<{ id: string }> }) {
    const t = useTranslations('memberProfile')
    const locale = useLocale()
    const { user } = useAuth()
    const [id, setId] = useState('')
    const [profile, setProfile] = useState<any>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        params.then(({ id: value }) => {
            setId(value)
            api(`/api/users/${value}`)
                .then(setProfile)
                .catch(() => setProfile(null))
        })
    }, [params])
    useEffect(() => {
        if (!id || !user) return
        const socket = getSocket()
        const receiveFriendRequest = (notification: any) => {
            const actorId = notification?.actorId?._id || notification?.actorId
            if (notification?.type !== 'friend_request' || String(actorId) !== String(id)) return
            setProfile((current: any) => ({
                ...current,
                relation: { requesterId: actorId, addresseeId: user._id, status: 'pending' },
            }))
        }
        const receiveFriendshipUpdate = (update: any) => {
            const samePair = [update.requesterId, update.addresseeId].includes(String(id)) && [update.requesterId, update.addresseeId].includes(String(user._id))
            if (!samePair) return
            api(`/api/users/${id}`).then((latestProfile) => setProfile(latestProfile)).catch(() => {
                setProfile((current: any) => ({ ...current, relation: update.status === 'none' || update.status === 'rejected' ? null : update }))
            })
        }
        socket?.on('notification:new', receiveFriendRequest)
        socket?.on('friendship:update', receiveFriendshipUpdate)
        return () => {
            socket?.off('notification:new', receiveFriendRequest)
            socket?.off('friendship:update', receiveFriendshipUpdate)
        }
    }, [id, user?._id])
    const relation = profile?.relation
    const isSelf = user?._id === id
    const isIncomingRequest = relation?.status === 'pending' && String(relation.addresseeId) === String(user?._id)
    const friendshipLabel =
        relation?.status === 'accepted'
            ? t('friends')
            : isIncomingRequest
                ? t('accept')
                : relation?.status === 'pending'
                    ? t('pending')
                    : t('addFriend')
    const friend = async () => {
        if (!user || isSelf) return
        setBusy(true)
        try {
            const action = isIncomingRequest
                ? 'accept'
                : relation?.status === 'accepted' || relation?.status === 'pending'
                    ? 'remove'
                    : 'request'
            const next = await api('/api/social/friends', {
                method: 'POST',
                body: JSON.stringify({ userId: id, action }),
            })
            setProfile((current: any) => ({
                ...current,
                relation: next.status === 'none' ? null : next,
            }))
        } finally {
            setBusy(false)
        }
    }
    if (!profile)
        return (
            <div className="custom-breadcrumb !py-16">
                <Skeleton active />
            </div>
        )
    return (
        <main className="custom-breadcrumb !pt-3 !pb-20">
            <div className="mb-8 w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]">
                <h1 className="text-center text-lg text-white font-semibold">
                    TRANG CÁ NHÂN
                </h1>
            </div>
            <Link
                href={`/${locale}/cong-dong`}
                className="inline-flex items-center gap-2 text-gray-500 hover:!text-[var(--primary)] !text-gray-500"
            >
                <ArrowLeft size={16} /> {t('back')}
            </Link>
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dbe3e8] bg-[#f4f7f8] shadow-sm">
                <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
                    <Avatar size={92} src={profile.avatar} icon={<UserRound />} className="shrink-0 !bg-[#0b2b3d] !text-3xl !text-white" />
                    <div className="min-w-0 flex-1">
                        <Flex align="center" gap={10} wrap="wrap">
                            <Typography.Title level={2} className="!m-0 !text-[#0b2b3d]">{profile.fullName}</Typography.Title>
                            <Tag color="cyan" className="!m-0">{t('member')}</Tag>
                        </Flex>
                        <Typography.Text className="text-sm text-gray-500">{t('joined', { year: new Date(profile.createdAt).getFullYear() })}</Typography.Text>
                        <Flex gap={30} className="!mt-5">
                            {[[profile.posts?.length || 0, t('postsCount')], [profile.friendsCount || 0, t('friendsCount')], [(profile.likesCount || 0).toLocaleString('vi-VN'), t('likesCount')]].map(([value, label]) => <div key={String(label)}><div className="text-xl font-semibold leading-5 text-[#0b2b3d]">{value}</div><div className="mt-1 text-xs text-gray-500">{label}</div></div>)}
                        </Flex>
                    </div>
                    {!isSelf && user && <Flex gap={10} className="shrink-0" wrap="wrap">
                        <Button type="primary" icon={<UserPlus size={16} />} loading={busy} onClick={friend} className="!rounded-full !border-0 !bg-[#ff5a1f] !px-5 !font-semibold">{friendshipLabel}</Button>
                        <Button icon={<MessageCircle size={16} />} onClick={() => window.dispatchEvent(new CustomEvent('messenger:open', { detail: profile }))} className="!rounded-full !px-5 !font-semibold">{t('message')}</Button>
                    </Flex>}
                </div>
            </section>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section>
                    <Typography.Title
                        level={3}
                        className="!mb-4"
                    >
                        {t('posts')}
                    </Typography.Title>
                    <div className="space-y-4">
                        {profile.posts?.length ? (
                            profile.posts.map((post: any) => (
                                <article
                                    key={post._id}
                                    className="rounded-2xl border border-[#e6e9f3] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
                                >
                                    <Typography.Text className="text-xs uppercase text-gray-400">
                                        {new Date(post.createdAt).toLocaleString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour12: false,
                                        })}
                                    </Typography.Text>
                                    <Link
                                        href={`/${locale}/cong-dong/bai-viet/${post._id}`}
                                    >
                                        <Typography.Title
                                            level={4}
                                            className="!mb-2 !mt-2 hover:!text-[var(--primary)]"
                                        >
                                            {post.title}
                                        </Typography.Title>
                                    </Link>
                                    <RichTextContent
                                        html={post.content}
                                        className="line-clamp-3 text-gray-600"
                                    />
                                    <div className="mt-4 text-xs text-gray-400">
                                        {post.likesCount} lượt thích ·{' '}
                                        {post.commentsCount} bình luận
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[#cbd2e6] bg-white/60 p-10 text-center text-gray-500">
                                {t('noPosts')}
                            </div>
                        )}
                    </div>
                </section>
                <aside className="h-fit rounded-2xl border border-[#e6e9f3] bg-white p-5 shadow-sm">
                    <Typography.Title
                        level={5}
                        className="!mt-0"
                    >
                        {t('about')}
                    </Typography.Title>
                    <Link href={`mailto:${profile.email}`}>
                        <Typography.Text className="text-gray-500 flex items-center gap-2 underline">
                            <Mail color='#ef5a22' className='text-[#ef5a22]' size={16} />{profile.email || t('member')}
                        </Typography.Text>
                    </Link>
                    {profile.phone && (
                        <Link href={`tel:${profile.phone}`}>
                            <Typography.Text className="!mb-0 !mt-3 text-gray-500 flex items-center gap-2 underline">
                                <Phone color='#ef5a22' className='text-[#ef5a22]' size={16} />{profile.phone}
                            </Typography.Text>
                        </Link>
                    )}
                </aside>
            </div>
        </main>
    )
}

export default function MemberProfile({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    return (
        <MemberProfileContent params={params} />
    )
}
