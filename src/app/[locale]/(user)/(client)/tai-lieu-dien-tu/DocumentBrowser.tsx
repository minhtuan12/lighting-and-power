'use client'

import DefaultImage from '@/components/DefaultImage'
import FileViewer from '@/components/FileViewer'
import Loading from '@/components/Loading'
import RichTextContent from '@/components/RichTextContent'
import { IDocument } from '@/types/document'
import { IDocumentCategory } from '@/types/document-category'
import { Card, Empty, Flex, Menu, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

const { Title, Text } = Typography

async function fetchSections(type: string): Promise<IDocument[]> {
    const res = await fetch(`/api/documents?type=${type}`, {
        cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.documents || []
}

export default function DocumentBrowser({ categories }: { categories: IDocumentCategory[] }) {
    const [activeCategory, setActiveCategory] =
        useState<IDocumentCategory | null>(categories?.[0] ?? null)
    const [sections, setSections] = useState<IDocument[]>([])
    const [activeSection, setActiveSection] = useState<IDocument | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)
    const [isLoadingSections, setIsLoadingSections] = useState(false)

    useEffect(() => {
        if (!activeCategory?.slug) return

        setIsLoadingSections(true)
        fetchSections(activeCategory.slug)
            .then((data) => {
                setSections(data)
                setActiveSection(data[0] || null)
            })
            .finally(() => setIsLoadingSections(false))
    }, [activeCategory?.slug])

    const sectionMenuItems = useMemo(
        () =>
            sections.map((section) => ({
                key: section._id || section.slug,
                label: section.title,
            })),
        [sections],
    )

    return (
        <Flex
            vertical
            gap={20}
            className="!mt-6 !mb-20"
        >
            <div className="w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]">
                <h1 className="text-center text-lg text-white font-semibold">
                    TÀI LIỆU KỸ THUẬT
                </h1>
            </div>

            {isLoadingCategories ? (
                <Loading />
            ) : (
                <Flex
                    className="justify-center w-full overflow-x-auto py-2 scrollbar-thin"
                    gap={10}
                >
                    {categories.map((cat) => {
                        const isActive = activeCategory?.slug === cat.slug;
                        return <div
                            key={cat.slug}
                            className={`min-w-30 cursor-pointer p-3 rounded-md text-center 
                                ${isActive ? 'bg-[var(--primary)] text-white'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat.name}
                        </div>
                    })}
                </Flex>
            )}

            <Flex
                gap={20}
                className="w-full"
            >
                <Card className="w-[280px] h-fit shadow-md border border-gray-100">
                    <Title
                        level={5}
                        className="!mb-3"
                    >
                        {activeCategory?.name || 'Danh mục'}
                    </Title>
                    {isLoadingSections ? (
                        <Loading />
                    ) : sections.length === 0 ? (
                        <Empty description="Chưa có mục nội dung" />
                    ) : (
                        <Menu
                            mode="inline"
                            items={sectionMenuItems}
                            selectedKeys={[
                                activeSection?._id || activeSection?.slug || '',
                            ]}
                            onClick={(e) => {
                                const found = sections.find(
                                    (s) =>
                                        (s._id || s.slug) === e.key,
                                )
                                setActiveSection(found || null)
                            }}
                        />
                    )}
                </Card>


                <div className="relative min-h-[360px] overflow-hidden rounded-lg flex-1">
                    <div
                        className="absolute inset-0 bg-center bg-no-repeat bg-cover opacity-70"
                        style={{
                            backgroundImage: "url('/images/L&P.png')",
                            translate: 'rotate(-15deg)',
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/60" />
                    <div className="relative p-6 lg:p-8">
                        {activeSection ? (
                            <div className="space-y-4">
                                <Title level={4} className="!mb-1 select-none">
                                    {activeSection.title}
                                </Title>
                                {activeSection.thumbnail && (
                                    <DefaultImage
                                        src={activeSection.thumbnail}
                                        className="w-full h-[320px]"
                                        title={activeSection.title}
                                    />
                                )}
                                {activeSection.description && (
                                    <Text className="text-base select-none">
                                        {activeSection.description}
                                    </Text>
                                )}
                                {activeSection.contentType === 'text' &&
                                    activeSection.content && (
                                        <RichTextContent
                                            html={activeSection.content}
                                            className='select-none'
                                        />
                                    )}
                                {activeSection.contentType === 'file' &&
                                    activeSection.fileUrl && (
                                        <FileViewer
                                            documents={[
                                                { uri: activeSection.fileUrl },
                                            ]}
                                        />
                                    )}
                            </div>
                        ) : (
                            <Empty description="Chọn một mục nội dung" />
                        )}
                    </div>
                </div>
            </Flex>
        </Flex>
    )
}
