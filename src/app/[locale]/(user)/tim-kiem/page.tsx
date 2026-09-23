import ProductItem from '@/app/[locale]/(user)/(components)/ProductItem'
import { routes } from '@/constants/routes'
import { fetchDocumentCategories, getDocuments } from '@/fetch-data/documents'
import { getProducts } from '@/fetch-data/products'
import { IDocument, IDocumentType } from '@/types/document'
import { IDocumentCategory } from '@/types/document-category'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

function DocumentCategoryGroup({
    category,
    categories,
    documents,
}: {
    category: IDocumentCategory
    categories: IDocumentCategory[]
    documents: IDocument[]
}) {
    const categoryId = String(category._id)
    const ownDocuments = documents.filter((document) => {
        const type =
            typeof document.type === 'object'
                ? document.type?._id
                : document.type
        return String(type) === categoryId
    })
    const children = categories.filter(
        (item) => String(item.parentId || '') === String(category._id || ''),
    )
    const hasDocuments = (current: IDocumentCategory): boolean => {
        const currentId = String(current._id)
        if (
            documents.some(
                (document) =>
                    String(
                        typeof document.type === 'object'
                            ? document.type?._id
                            : document.type,
                    ) === currentId,
            )
        )
            return true
        return categories
            .filter((item) => String(item.parentId || '') === currentId)
            .some(hasDocuments)
    }
    if (!hasDocuments(category)) return null
    return (
        <div className="space-y-4">
            <h3 className="text-[14px] font-bold uppercase tracking-wide text-[#ff6b16]">
                {category.name}
            </h3>
            {ownDocuments.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {ownDocuments.map((document) => (
                        <Link
                            key={document._id}
                            href={`${routes.taiLieuDienTu.url}?muc=${document.slug}&loai=${(document.type as IDocumentType)?.slug}`}
                            className="rounded-full border border-[#e1e5ed] bg-white px-5 py-3 text-[15px] font-medium !text-[#082c40] shadow-sm transition hover:border-[#218eae] hover:text-[#218eae]"
                        >
                            {document.title}
                        </Link>
                    ))}
                </div>
            )}
            {children.map((child) => (
                <div
                    key={child._id}
                    className="pl-1"
                >
                    <DocumentCategoryGroup
                        key={child._id}
                        category={child}
                        categories={categories}
                        documents={documents}
                    />
                </div>
            ))}
        </div>
    )
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const query = ((await searchParams).q || '').trim()
    const t = await getTranslations('common')
    const [{ data: productData }, { data: documentData }, categories] =
        await Promise.all([
            getProducts({ search: query, page: 1 }),
            getDocuments(query),
            fetchDocumentCategories(),
        ])
    const roots = categories.filter((category) => !category.parentId)

    return (
        <main className="mx-auto min-h-[calc(100vh-250px)] max-w-[1140px] px-6 pb-20 pt-4">
            <h1 className="mb-8 text-xl font-semibold text-[#082c40] text-center">
                {t('search')}: <span className="font-normal">"{query}"</span>
            </h1>
            <section className="mb-12">
                <h2 className="mb-5 text-xl font-semibold">{t('product')}</h2>
                {productData.products.length ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {productData.products.map((product) => (
                            <ProductItem
                                item={product}
                                enableAddToCart
                                key={product._id}
                                className="!w-full"
                                wrapClassName="!w-full"
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Không tìm thấy sản phẩm.</p>
                )}
            </section>
            <section className="rounded-sm bg-[#f5f6fb] px-4 py-5 md:px-6 md:py-6">
                <h2 className="mb-6 text-xl font-bold text-[#082c40]">
                    {t('document')}
                </h2>
                {documentData.documents.length ? (
                    <div className="space-y-10">
                        {roots.map((category) => (
                            <DocumentCategoryGroup
                                key={category._id}
                                category={category}
                                categories={categories}
                                documents={documentData.documents}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Không tìm thấy tài liệu.</p>
                )}
            </section>
        </main>
    )
}
