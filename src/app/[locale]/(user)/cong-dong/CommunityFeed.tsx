'use client'

import RichTextContent from '@/components/RichTextContent'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { useMe } from '@/hooks/use-me'
import { showMessage } from '@/hooks/use-message'
import { ECommunityPostType, ICommunityPost } from '@/types/community'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Divider, Flex, Form, Input, Tag } from 'antd'
import {
    Book,
    MessageCircle,
    MoreHorizontal,
    PenLine,
    Share2,
    Sparkles,
    Zap,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LoginModal from '../(components)/LoginModal'
import './community.css'

const labels = {
    post: {
        icon: Book,
        label: 'BÀI VIẾT',
    },
    question: {
        icon: MessageCircle,
        label: 'HỎI ĐÁP KỸ THUẬT',
    },
    project: {
        icon: Zap,
        label: 'DỰ ÁN',
    },
    tip: {
        icon: Sparkles,
        label: 'MẸO & THỦ THUẬT',
    },
}
const api = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || 'Có lỗi xảy ra')
    return body.data
}

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

function PostCard({
    post,
    refresh,
}: {
    post: ICommunityPost
    refresh: () => void
}) {
    const [busy, setBusy] = useState(false)
    const locale = useLocale();
    const like = async () => {
        setBusy(true)
        try {
            await api(`/api/community/posts/${post._id}/like`, {
                method: 'POST',
            })
            refresh()
        } catch (error: any) {
            showMessage.error(error.message)
        } finally {
            setBusy(false)
        }
    }
    const share = async () => {
        const url = `${window.location.origin}/${locale}/cong-dong/bai-viet/${post._id}`
        try {
            await navigator.clipboard.writeText(url)
        } catch {
            const input = document.createElement('textarea')
            input.value = url
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            input.remove()
        }
        await api(`/api/community/posts/${post._id}/share`, {
            method: 'POST',
        }).catch(() => null)
        showMessage.success('Đã sao chép liên kết bài viết')
    }

    const Icon = labels[post.type].icon;
    return (
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
                        <strong>{post.author.fullName}</strong>
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
                {/* <button
                    className="quiet-button"
                    aria-label="Tùy chọn"
                >
                    <MoreHorizontal size={20} />
                </button> */}
            </div>
            <div className="post-label">
                <Icon size={16} />
                <div className='mt-0.5'>{labels[post.type].label || labels.post.label}</div>
            </div>
            <Link
                href={`/${locale}/cong-dong/bai-viet/${post._id}`}
                className="post-title !mt-4"
            >
                {post.title}
            </Link>
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
                    disabled={busy}
                    className={
                        post.likedByMe ? 'action-button liked' : 'action-button'
                    }
                    onClick={like}
                >
                    <Zap
                        size={17}
                        className={`${post.likedByMe ? 'fill-[#ef5a22] text-[#ef5a22]' : ''}`}
                    />
                    {post.likesCount}
                </button>
                <Link
                    className="action-button"
                    href={`/${locale}/cong-dong/bai-viet/${post._id}`}
                >
                    <MessageCircle size={17} />
                    {post.commentsCount} bình luận
                </Link>
                <button
                    className="action-button"
                    onClick={share}
                >
                    <Share2 size={16} />
                    {post.sharesCount} chia sẻ
                </button>
            </div>
        </article>
    )
}

export default function CommunityFeed() {
    const t = useTranslations('common');
    const { user } = useMe()
    const [posts, setPosts] = useState<ICommunityPost[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        members: 0,
        postsToday: 0,
        activeUsers: 0,
        topics: [] as string[],
    })
    const [composerOpen, setComposerOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [form] = Form.useForm()
    const [selectedType, setSelectedType] = useState(ECommunityPostType.post)
    const load = async () => {
        setLoading(true)
        try {
            const data = await api('/api/community/posts?limit=20')
            setPosts(data.posts)
        } catch (error: any) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        load()
        api('/api/community/stats').then(setStats).catch(console.error)
    }, [])
    const submit = async (values: {
        type: ECommunityPostType
        title: string
        content: string
        mediaUrl?: string
    }) => {
        try {
            await api('/api/community/posts', {
                method: 'POST',
                body: JSON.stringify(values),
            })
            form.resetFields()
            form.setFieldValue('type', ECommunityPostType.post)
            setSelectedType(ECommunityPostType.post)
            setComposerOpen(false)
            showMessage.success('Đăng bài viết thành công')
            load()
        } catch (error: any) {
            showMessage.error(error.message)
        }
    }
    return (
        <div className="!mt-3 !mb-20 min-h-[calc(100vh-403px)] flex flex-col gap-5">
            <div className="w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]">
                <h1 className="text-center text-lg text-white font-semibold">
                    {t('community').toUpperCase()}
                </h1>
            </div>
            <div className="community-shell">
                <section className="community-main">
                    {user ? <div className="community-composer">
                        <div className="p-4 gap-3 items-center flex">
                            <Avatar
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                className="!h-10 !w-11"
                            />
                            <button
                                className="composer-trigger"
                                onClick={() => setComposerOpen(!composerOpen)}
                            >
                                <span>
                                    Bạn đang nghĩ gì, chia sẻ với cộng đồng…
                                </span>
                                <PenLine size={18} />
                            </button>
                        </div>
                        {composerOpen && (
                            <Form
                                form={form}
                                className="composer-form !p-3"
                                layout="vertical"
                                initialValues={{
                                    type: ECommunityPostType.post,
                                }}
                                onFinish={submit}
                            >
                                <div className="composer-types">
                                    {Object.values(ECommunityPostType).map(
                                        (type) => {
                                            const Icon = labels[type].icon
                                            return (
                                                <button
                                                    key={type}
                                                    className={`${selectedType === type
                                                        ? 'type-active'
                                                        : ''
                                                        } flex items-center gap-1.5`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedType(type)
                                                        form.setFieldValue(
                                                            'type',
                                                            type,
                                                        )
                                                    }}
                                                >
                                                    <Icon size={14} />
                                                    {labels[type].label}
                                                </button>
                                            )
                                        },
                                    )}
                                </div>
                                <Form.Item
                                    name="title"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                'Vui lòng nhập tiêu đề bài viết',
                                        },
                                    ]}
                                >
                                    <Input placeholder="Tiêu đề bài viết" />
                                </Form.Item>
                                <Form.Item
                                    name="content"
                                    rules={[
                                        {
                                            validator: async (_, value) => {
                                                const text = String(value || '')
                                                    .replace(/<[^>]*>/g, '')
                                                    .trim()
                                                if (!text)
                                                    throw new Error(
                                                        'Vui lòng nhập nội dung bài viết',
                                                    )
                                            },
                                        },
                                    ]}
                                >
                                    <SimpleEditor placeholder="Chia sẻ điều bạn đang làm, đang học hoặc muốn hỏi…" />
                                </Form.Item>
                                {/*
                                <textarea
                                    rows={5}
                                    placeholder="Chia sẻ điều bạn đang làm, đang học hoặc muốn hỏi…"
                                    value={form.content}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            content: e.target.value,
                                        })
                                    }
                                /> */}
                                {/* <input
                                    placeholder="URL hình ảnh (không bắt buộc)"
                                    value={form.mediaUrl}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            mediaUrl: e.target.value,
                                        })
                                    }
                                /> */}
                                <button
                                    className="primary-button mt-2"
                                    type="submit"
                                >
                                    Đăng bài viết
                                </button>
                            </Form>
                        )}
                    </div> : <div className="community-composer p-6 text-center">
                        <div className="text-gray-600">Vui lòng đăng nhập để đăng bài</div>
                        <button className="primary-button mt-3" onClick={() => setLoginOpen(true)}>
                            {t('login')}
                        </button>
                        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
                    </div>}
                    <Divider
                        variant="dashed"
                        size="large"
                        className="!border-blue-300"
                    />
                    {loading ? (
                        <div className="feed-loading">Đang tải cộng đồng…</div>
                    ) : posts.length ? (
                        posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                refresh={load}
                            />
                        ))
                    ) : (
                        <div className="empty-community">
                            Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ.
                        </div>
                    )}
                </section>
                <aside className="community-sidebar">
                    <div className="side-panel stats-panel">
                        <div className="panel-heading">Cộng đồng</div>
                        <div className="stats-row">
                            <span>Thành viên</span>
                            <strong>
                                {stats.members.toLocaleString('vi-VN')}
                            </strong>
                        </div>
                        <div className="stats-row">
                            <span>Bài viết hôm nay</span>
                            <strong>
                                {stats.postsToday.toLocaleString('vi-VN')}
                            </strong>
                        </div>
                        <div className="stats-row">
                            <span>Đang hoạt động</span>
                            <strong className="active-stat">
                                <span className="signal-dot" />
                                {stats.activeUsers.toLocaleString('vi-VN')}
                            </strong>
                        </div>
                    </div>
                    {stats.topics?.length > 0 && (
                        <div className="side-panel">
                            <div className="panel-heading">Chủ đề nổi bật</div>
                            <div className="topic-list">
                                {stats.topics.map((topic) => (
                                    <span key={topic}>
                                        #{topic.replace(/^#/, '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="side-panel rules">
                        <div className="panel-heading">Quy định cộng đồng</div>
                        <ol>
                            <li>Tôn trọng, không công kích cá nhân</li>
                            <li>Đăng đúng chuyên mục kỹ thuật</li>
                            <li>Không spam quảng cáo ngoài shop</li>
                            <li>Luôn cảnh báo an toàn điện</li>
                        </ol>
                    </div>
                </aside>
            </div>
        </div>
    )
}
