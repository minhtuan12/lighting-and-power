'use client'

import RichTextContent from '@/components/RichTextContent'
import { useMe } from '@/hooks/use-me'
import { showMessage } from '@/hooks/use-message'
import { loginModalAtom } from '@/stores'
import { ICommunityComment, ICommunityPost } from '@/types/community'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Flex, Tag } from 'antd'
import { useSetAtom } from 'jotai'
import { ArrowLeft, MessageCircle, Send, Share2, Zap } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import '../../community.css'

function ago(date: string | Date) {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    return minutes < 1
        ? 'vừa xong'
        : minutes < 60
            ? `${minutes} phút trước`
            : minutes < 1440
                ? `${Math.floor(minutes / 60)} giờ trước`
                : new Date(date).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour12: false,
                })
}

const api = async (url: string, options?: RequestInit) => {
    const r = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    })
    const b = await r.json()
    if (!r.ok) throw new Error(b.message || 'Có lỗi xảy ra')
    return b.data
}

export default function PostDetail({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const locale = useLocale()
    const [post, setPost] = useState<ICommunityPost | null>(null)
    const [comments, setComments] = useState<ICommunityComment[]>([])
    const [content, setContent] = useState('')
    const [id, setId] = useState('')
    const { user } = useMe()
    const setLoginOpen = useSetAtom(loginModalAtom)
    useEffect(() => {
        params.then(({ id }) => {
            setId(id)
            Promise.all([
                api(`/api/community/posts/${id}`),
                api(`/api/community/posts/${id}/comments`),
            ])
                .then(([p, c]) => {
                    setPost(p)
                    setComments(c)
                })
                .catch(console.error)
        })
    }, [params])
    if (!post) return <div className="feed-loading">Đang tải bài viết…</div>
    const comment = async () => {
        if (!user) {
            setLoginOpen(true)
            return
        }
        if (!content.trim()) return
        try {
            const item = await api(`/api/community/posts/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content }),
            })
            setComments([...comments, item])
            setContent('')
        } catch (error: any) {
            showMessage.error(error.message)
        }
    }
    const like = async () => {
        try {
            const result = await api(`/api/community/posts/${id}/like`, {
                method: 'POST',
            })
            setPost({
                ...post,
                likedByMe: result.liked,
                likesCount: result.likesCount,
            })
        } catch (error: any) {
            showMessage.error(error.message)
        }
    }
    const share = async () => {
        await navigator.clipboard?.writeText(window.location.href)
        await api(`/api/community/posts/${id}/share`, { method: 'POST' }).catch(
            () => null,
        )
        showMessage.success('Đã sao chép liên kết bài viết')
    }
    return (
        <div className="community-shell">
            <main className="community-main">
                <Link
                    href="/vi/cong-dong"
                    className="action-button"
                    style={{ marginBottom: 12 }}
                >
                    <ArrowLeft size={16} /> Về cộng đồng
                </Link>
                <article className="community-post">
                    <div className="post-author">
                        <Avatar
                            src={post.author.avatar}
                            icon={<UserOutlined className='!-mr-[1px]' />}
                            alt=""
                            className="!h-10 !w-10"
                        />
                        <div>
                            <Flex align='center' gap={6}>
                                <Link href={`/${locale}/thanh-vien/${post.author._id}`} className="font-semibold hover:!text-[var(--primary)] !text-black">
                                    {post.author.fullName}
                                </Link>
                                <Tag
                                    color={post.author.role === 'admin' ? 'blue' : 'green'}
                                    className='!mt-0'
                                >
                                    {post.author.role === 'admin'
                                        ? 'Cửa hàng chính thức'
                                        : 'Thành viên'}
                                </Tag>
                            </Flex>
                            <div className='text-gray-500 text-xs'>{ago(post.createdAt)}</div>
                        </div>
                    </div>
                    <h1
                        className="post-title"
                        style={{ fontSize: 28, marginTop: 18 }}
                    >
                        {post.title}
                    </h1>
                    <RichTextContent className='post-content' html={post.content} />
                    {post.mediaUrl && (
                        <img
                            className="post-image"
                            src={post.mediaUrl}
                            alt={post.title}
                        />
                    )}
                    <div className="post-actions">
                        <button
                            className={
                                post.likedByMe
                                    ? 'action-button liked'
                                    : 'action-button'
                            }
                            onClick={like}
                        >
                            <Zap
                                size={17}
                                fill={post.likedByMe ? '#ef5a22' : 'none'}
                                className={post.likedByMe ? 'text-[#ef5a22]' : ''}
                            />
                            {post.likesCount}
                        </button>
                        <span className="action-button">
                            <MessageCircle size={17} />
                            {comments.length}
                        </span>
                        <button
                            className="action-button"
                            onClick={share}
                        >
                            <Share2 size={16} />
                            Chia sẻ
                        </button>
                    </div>
                </article>
                <section className="community-post">
                    <h2
                        style={{
                            font: "700 20px inherit",
                            marginTop: 0,
                        }}
                    >
                        Thảo luận{' '}
                        <span style={{ color: '#84939a', fontSize: 14 }}>
                            {comments.length}
                        </span>
                    </h2>
                    <div
                        className="composer-trigger"
                        style={{ padding: '10px 0' }}
                    >
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Viết bình luận của bạn…"
                            rows={3}
                            style={{
                                flex: 1,
                                border: '1px solid #dce6e9',
                                borderRadius: 12,
                                padding: 12,
                                font: 'inherit',
                            }}
                        />
                        <button
                            className="primary-button"
                            onClick={comment}
                            aria-label="Gửi bình luận"
                        >
                            <Send size={17} />
                        </button>
                    </div>
                    {comments.map((item) => (
                        <div
                            key={item._id}
                            style={{ display: 'flex', gap: 10, marginTop: 17 }}
                        >
                            <Avatar
                                src={item.author.avatar}
                                icon={<UserOutlined className='!-mr-[1px]' />}
                                alt=""
                                className="!h-10 !w-10"
                            />
                            <div
                                style={{
                                    background: '#f4f7f8',
                                    borderRadius: 12,
                                    padding: '9px 13px',
                                    flex: 1,
                                }}
                            >
                                <Flex justify='space-between' align='center'>
                                    <strong style={{ fontSize: 13 }}>
                                        {item.author.fullName}
                                    </strong>
                                    <div className='text-[13px] text-gray-500'>
                                        {ago(item.createdAt)}
                                    </div>
                                </Flex>
                                <p
                                    style={{
                                        margin: '4px 0 0',
                                        fontSize: 14,
                                        whiteSpace: 'pre-line',
                                    }}
                                >
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
            <aside className="community-sidebar">
                <div className="side-panel rules">
                    <div className="panel-heading">GỢI Ý AN TOÀN</div>
                    <p
                        style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: '#c4d8dd',
                            margin: 0,
                        }}
                    >
                        Luôn ngắt nguồn trước khi kiểm tra hoặc lắp đặt thiết bị
                        điện.
                    </p>
                </div>
            </aside>
        </div>
    )
}
