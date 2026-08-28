'use client'

import FileViewer from '@/components/FileViewer'
import Loading from '@/components/Loading'
import RichTextContent from '@/components/RichTextContent'
import { IDocument } from '@/types/document'
import { IDocumentCategory } from '@/types/document-category'
import {
    Card,
    Empty,
    Flex,
    Menu,
    Typography,
    Watermark,
    WatermarkProps,
} from 'antd'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
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

interface WatermarkConfig {
    content: string
    color: any
    fontSize: number
    zIndex: number
    rotate: number
    gap: [number, number]
    offset?: [number, number]
}

export default function DocumentBrowser({
    categories,
}: {
    categories: IDocumentCategory[]
}) {
    const [activeCategory, setActiveCategory] =
        useState<IDocumentCategory | null>(categories?.[0] ?? null)
    const [sections, setSections] = useState<IDocument[]>([])
    const [activeSection, setActiveSection] = useState<IDocument | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const t = useTranslations('common')

    const [config] = useState<WatermarkConfig>({
        content: 'Lighting & Power',
        color: 'rgba(0, 0, 0, 0.15)',
        fontSize: 16,
        zIndex: 11,
        rotate: -22,
        gap: [100, 100],
        offset: undefined,
    })
    const { content, color, fontSize, zIndex, rotate, gap, offset } = config

    const watermarkProps: WatermarkProps = {
        content,
        zIndex,
        rotate,
        gap,
        offset,
        font: {
            color: typeof color === 'string' ? color : color.toRgbString(),
            fontSize,
        },
    }

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
            className="!mt-6 !mb-20 min-h-[calc(100vh-403px)]"
        >
            <div className="w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]">
                <h1 className="text-center text-lg text-white font-semibold">
                    {t('document').toUpperCase()}
                </h1>
            </div>

            {isLoadingCategories ? (
                <Loading />
            ) : (
                <Flex
                    className="justify-center w-full overflow-x-auto py-2 scrollbar-thin sticky top-40 z-1000"
                    gap={10}
                >
                    {categories.map((cat) => {
                        const isActive = activeCategory?.slug === cat.slug
                        return (
                            <div
                                key={cat.slug}
                                className={`min-w-30 cursor-pointer p-3 rounded-md text-center 
                                ${isActive
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                onClick={() => {
                                    setActiveCategory(cat)
                                    window.scrollTo({
                                        top: 0,
                                        behavior: 'instant',
                                    })
                                }}
                            >
                                {cat.name}
                            </div>
                        )
                    })}
                </Flex>
            )}

            <Card className="w-[280px] h-fit shadow-md border border-gray-100 [&_.ant-card]:bg-white z-[111] !sticky top-57">
                <Title
                    level={5}
                    className="!mb-3"
                >
                    {activeCategory?.name || 'Danh mục'}
                </Title>
                {isLoadingSections ? (
                    <Loading />
                ) : sections.length === 0 ? (
                    <Empty
                        description="Chưa có mục nội dung"
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        className="flex items-center flex-col"
                    />
                ) : (
                    <Menu
                        mode="inline"
                        items={sectionMenuItems}
                        selectedKeys={[
                            activeSection?._id || activeSection?.slug || '',
                        ]}
                        onClick={(e) => {
                            const found = sections.find(
                                (s) => (s._id || s.slug) === e.key,
                            )
                            setActiveSection(found || null)
                            window.scrollTo({ top: 0, behavior: 'instant' })
                        }}
                    />
                )}
            </Card>

            <Watermark
                {...watermarkProps}
                className="-top-38"
            >
                <Flex
                    gap={20}
                    className="w-[calc(100%-280px)] flex-1 relative !ml-[280px] min-h-[300px]"
                >
                    <div className="relative rounded-lg flex-1">
                        <div className="relative p-6 lg:p-8 !pt-0">
                            {activeSection ? (
                                <div className="space-y-4">
                                    {activeSection.thumbnail && (
                                        <div className="relative aspect-17/10 rounded-sm">
                                            <Image
                                                alt={activeSection.title}
                                                src={activeSection.thumbnail}
                                                fill
                                                title={activeSection.title}
                                                objectFit="cover"
                                            />
                                        </div>
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
                                                className="select-none"
                                            />
                                        )}
                                    {activeSection.contentType === 'file' &&
                                        activeSection.fileUrl && (
                                            <FileViewer
                                                documents={[
                                                    {
                                                        uri: activeSection.fileUrl,
                                                    },
                                                ]}
                                            />
                                        )}
                                </div>
                            ) : (
                                <Empty
                                    description="Chọn một mục nội dung"
                                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                                    className="flex items-center flex-col"
                                />
                            )}
                        </div>
                    </div>
                </Flex>
            </Watermark>
        </Flex>
    )
}
