'use client'

import FileViewer from '@/components/FileViewer'
import Loading from '@/components/Loading'
import RichTextContent from '@/components/RichTextContent'
import { selectedDocumentAtom } from '@/stores/document'
import { IDocument } from '@/types/document'
import { IDocumentCategory } from '@/types/document-category'
import { DownOutlined } from '@ant-design/icons'
import {
    Card,
    Drawer,
    Empty,
    Flex,
    Menu,
    Typography,
    Watermark,
    WatermarkProps,
} from 'antd'
import { useAtom } from 'jotai'
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
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('loai');
    const section = urlParams.get('muc');
    const [selectedDocument, setSelectedDocument] = useAtom(selectedDocumentAtom)
    const [activeCategory, setActiveCategory] = useState<IDocumentCategory | null>(() => {
        const selectedCategory = selectedDocument
            ? categories.find((category) => category.slug === selectedDocument.categorySlug)
            : null
        return (categories.find(c => c.slug === category)) || (selectedCategory ?? categories?.[0] ?? null)
    })
    const [sections, setSections] = useState<IDocument[]>([])
    const [activeSection, setActiveSection] = useState<IDocument | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const t = useTranslations('common')

    useEffect(() => {
        if (!activeCategory?.slug) return
        setActiveSection(sections.find((s) => s.slug === section) || null)
    }, [sections, activeCategory?.slug]);

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

        let cancelled = false
        setIsLoadingSections(true)
        fetchSections(activeCategory.slug)
            .then((data) => {
                if (cancelled) return
                setSections(data)
                const selected = selectedDocument?.categorySlug === activeCategory.slug
                    ? data.find((section) => section.slug === selectedDocument.sectionSlug)
                    : null
                setActiveSection(selected || data[0] || null)
                if (selected) setSelectedDocument(null)
            })
            .finally(() => {
                if (!cancelled) setIsLoadingSections(false)
            })
        return () => {
            cancelled = true
        }
        // Fetch only when the category changes. Clearing the selection atom after
        // opening the requested section must not fetch again and reset to section 1.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory?.slug])

    useEffect(() => {
        if (!selectedDocument) return
        const category = categories.find((item) => item.slug === selectedDocument.categorySlug)
        if (category && category.slug !== activeCategory?.slug) setActiveCategory(category)
    }, [selectedDocument, categories, activeCategory?.slug])

    const sectionMenuItems = useMemo(
        () =>
            sections.map((section) => ({
                key: section._id || section.slug,
                label: section.title,
            })),
        [sections],
    )

    const handleSelectSection = (key: string) => {
        const found = sections.find((s) => (s._id || s.slug) === key)
        setActiveSection(found || null)
        setMobileMenuOpen(false)
        window.scrollTo({ top: 0, behavior: 'instant' })
    }

    const sectionMenu = (
        <Menu
            mode="inline"
            items={sectionMenuItems}
            selectedKeys={[activeSection?._id || activeSection?.slug || '']}
            onClick={(e) => handleSelectSection(e.key)}
        />
    )

    const sectionEmpty = (
        <Empty
            description="Chưa có mục nội dung"
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            className="flex items-center flex-col"
        />
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
                    className="justify-start lg:justify-center w-full overflow-x-auto scrollbar-thin sticky top-15 lg:!top-[149.5px] z-1000 px-4 bg-white !py-3 lg:px-0 max-md:bg-white max-md:!py-2 max-md:h-auto max-md:!px-3"
                    gap={10}
                >
                    {categories.map((cat) => {
                        const isActive = activeCategory?.slug === cat.slug
                        return (
                            <div
                                key={cat.slug}
                                className={`min-w-fit lg:min-w-30 shrink-0 cursor-pointer px-4 py-2 lg:p-3 rounded-md text-center text-sm lg:text-base
                                max-md:rounded-full !rounded-full
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

            {/* Sidebar gốc — chỉ hiện từ lg trở lên, giữ nguyên như code cũ */}
            <Card className="!shadow-md hidden lg:block w-[280px] h-fit shadow-md border border-gray-100 [&_.ant-card]:bg-white z-[111] !sticky top-57">
                <Title level={5} className="!mb-3">
                    {activeCategory?.name || 'Danh mục'}
                </Title>
                {isLoadingSections ? (
                    <Loading />
                ) : sections.length === 0 ? (
                    sectionEmpty
                ) : (
                    sectionMenu
                )}
            </Card>

            {/* Thanh chọn mục cho mobile, thay thế sidebar */}
            <div
                className="lg:hidden sticky top-27 z-50 flex items-center justify-between bg-white border border-gray-200 px-4 py-3 shadow-sm -mt-5"
                onClick={() => setMobileMenuOpen(true)}
            >
                <Flex vertical>
                    <Text className="!text-xs text-gray-400">
                        {activeCategory?.name || 'Danh mục'}
                    </Text>
                    <Text className="!text-sm !font-medium">
                        {activeSection?.title || 'Chọn mục nội dung'}
                    </Text>
                </Flex>
                <DownOutlined className="text-gray-500" />
            </div>

            <Drawer
                title={activeCategory?.name || 'Danh mục'}
                placement="bottom"
                height="60%"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                className="lg:hidden"
            >
                {isLoadingSections ? (
                    <Loading />
                ) : sections.length === 0 ? (
                    sectionEmpty
                ) : (
                    sectionMenu
                )}
            </Drawer>

            <Watermark {...watermarkProps} className="max-md:-top-0 -top-38">
                <Flex
                    gap={20}
                    className="w-full lg:w-[calc(100%-280px)] flex-1 relative lg:!ml-[280px] min-h-[300px]"
                >
                    <div className="relative rounded-lg flex-1">
                        <div className="relative p-4 lg:p-8 !pt-0">
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
                                        <Text className="text-sm lg:text-base select-none">
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
