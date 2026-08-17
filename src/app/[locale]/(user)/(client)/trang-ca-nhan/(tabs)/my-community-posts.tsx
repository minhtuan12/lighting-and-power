'use client'

import RichTextContent from '@/components/RichTextContent'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { showMessage } from '@/hooks/use-message'
import { ICommunityPost } from '@/types/community'
import { Form, Input, Modal, Popconfirm } from 'antd'
import { Eye, Pencil, Save, Trash2, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import '../../../cong-dong/community.css'

export default function MyCommunityPosts() {
    const [posts, setPosts] = useState<ICommunityPost[]>([])
    const [editingPost, setEditingPost] = useState<ICommunityPost | null>(null)
    const [form] = Form.useForm<{ title: string; content: string }>()
    const locale = useLocale()

    const loadPosts = async () => {
        const response = await fetch('/api/community/posts?mine=true')
        const result = await response.json()
        if (response.ok) setPosts(result.data?.posts || [])
    }

    useEffect(() => {
        loadPosts().catch(console.error)
    }, [])

    const startEditing = (post: ICommunityPost) => {
        setEditingPost(post)
        form.setFieldsValue({ title: post.title, content: post.content })
    }

    const closeEditModal = () => {
        setEditingPost(null)
        form.resetFields()
    }

    const savePost = async (values: { title: string; content: string }) => {
        if (!editingPost) return
        const response = await fetch(
            `/api/community/posts/${editingPost._id}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            },
        )
        const result = await response.json()
        if (!response.ok) {
            showMessage.error(result.message || 'Không thể cập nhật bài viết')
            return
        }
        showMessage.success('Cập nhật bài viết thành công')
        setPosts((current) =>
            current.map((post) =>
                post._id === editingPost._id ? result.data : post,
            ),
        )
        closeEditModal()
    }

    const remove = async (id: string) => {
        const response = await fetch(`/api/community/posts/${id}`, {
            method: 'DELETE',
        })
        if (response.ok) {
            setPosts((current) => current.filter((post) => post._id !== id))
            showMessage.success('Xóa bài viết thành công')
        } else {
            showMessage.error('Đã có lỗi xảy ra')
        }
    }

    return (
        <div
            className="community-shell !block"
            style={{ padding: 0 }}
        >
            <main className="w-full">
                {posts.length ? (
                    posts.map((post) => (
                        <article
                            className="community-post"
                            key={post._id}
                        >
                            <Link
                                href={`/${locale}/cong-dong/bai-viet/${post._id}`}
                                className="post-title"
                            >
                                {post.title}
                            </Link>
                            <RichTextContent
                                className="post-content"
                                html={post.content}
                            />
                            <div className="post-actions">
                                <span className="action-button">
                                    <Eye size={16} />
                                    {post.likesCount} tương tác
                                </span>
                                <button
                                    className="action-button"
                                    type="button"
                                    onClick={() => startEditing(post)}
                                >
                                    <Pencil size={16} /> Sửa
                                </button>
                                <Popconfirm
                                    title="Xóa bài viết này?"
                                    description="Bài viết và toàn bộ bình luận sẽ bị xóa."
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => remove(post._id)}
                                >
                                    <button
                                        className="action-button"
                                        type="button"
                                    >
                                        <Trash2 size={16} /> Xóa
                                    </button>
                                </Popconfirm>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="empty-community">
                        Bạn chưa có bài viết nào.
                    </div>
                )}
            </main>

            <Modal
                open={Boolean(editingPost)}
                title="Chỉnh sửa bài viết"
                onCancel={closeEditModal}
                footer={null}
                destroyOnHidden
                width={760}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={savePost}
                    className="community-edit-form"
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tiêu đề bài viết',
                            },
                        ]}
                    >
                        <Input
                            placeholder="Tiêu đề bài viết"
                            className="h-[40px]"
                        />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Nội dung"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập nội dung bài viết',
                            },
                        ]}
                    >
                        <SimpleEditor placeholder="Nội dung bài viết" />
                    </Form.Item>
                    <div className="post-actions">
                        <button
                            className="action-button"
                            type="submit"
                        >
                            <Save size={16} /> Lưu thay đổi
                        </button>
                        <button
                            className="action-button"
                            type="button"
                            onClick={closeEditModal}
                        >
                            <X size={16} /> Hủy
                        </button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}
