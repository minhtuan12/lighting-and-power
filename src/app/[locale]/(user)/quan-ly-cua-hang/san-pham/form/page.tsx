"use client"

import {
    FloatingInput,
    FloatingInputNumber,
    FloatingSelect,
    FloatingTextArea,
} from "@/components/inputs/FloatingInputs"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { PRODUCT_STATUS_OPTIONS, PRODUCT_TAG_OPTIONS } from "@/constants/common"
import { routes } from "@/constants/routes"
import { useBoothCategories } from "@/hooks/user/use-booth-categories"
import { useBoothProducts } from "@/hooks/user/use-booth-products"
import { showMessage } from "@/hooks/use-message"
import { fetchAPI } from "@/lib/api-client"
import { convertNestedCategories } from "@/lib/utils"
import { breadcrumbAtom } from "@/stores"
import { ICategory } from "@/types/category"
import { EProductStatus, IProduct } from "@/types/product"
import { generateJSON } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import StarterKit from "@tiptap/starter-kit"
import {
    Button,
    Card,
    Checkbox,
    Col,
    Flex,
    Form,
    Row,
    Select,
    Switch,
    Upload,
} from "antd"
import { useSetAtom } from "jotai"
import { Plus, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import PriceTiers, { PriceTier } from "./(components)/PriceTiers"
import Specifications, { Specification } from "./(components)/Specifications"
import { useTierManagement } from "./use-tier-management"

export default function BoothProductForm() {
    const searchParams = useSearchParams()
    const productId = searchParams.get("id")
    const isEdit = !!productId
    const id = productId || ""
    const router = useRouter()
    const setBreadcrumb = useSetAtom(breadcrumbAtom)
    const [form] = Form.useForm()
    const [description, setDescription] = useState("")
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imageFilesPreview, setImageFilesPreview] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<
        string[]
    >([])

    const {
        products: allProducts,
        isLoading: isLoadingProducts,
        createProductAsync,
        updateProductAsync,
        isCreating,
        isUpdating,
        getProductById,
    } = useBoothProducts({ status: "all" })
    const { data: productData, isLoading: isLoadingProduct } = id
        ? getProductById(id)
        : { data: null, isLoading: false }
    const { categories: categoriesData } = useBoothCategories({ view: "list" })
    const categoriesList = categoriesData?.data || []

    const relatedProductsList =
        allProducts?.data?.products
            ?.filter((p: IProduct) => !isEdit || p._id !== id)
            ?.map((p: IProduct) => ({
                value: p._id,
                label: `${p.name} (${p.sku})`,
            })) || []

    const {
        tiers: priceTiers,
        newTier: newPriceTier,
        handleAddTier: addPriceTier,
        handleDeleteTier: deletePriceTier,
        updateNewTierField: updatePriceTierField,
    } = useTierManagement<PriceTier>(
        isEdit && productData?.data ? productData.data.priceTiers : [],
    )
    const {
        tiers: specifications,
        newTier: newSpecification,
        handleAddTier: addSpecification,
        handleDeleteTier: deleteSpecification,
        updateNewTierField: updateSpecificationField,
    } = useTierManagement<Specification>(
        isEdit && productData?.data ? productData.data.specifications : [],
    )

    const uploadImagesToCloudinary = useCallback(async (files: File[]) => {
        const uploadedUrls: string[] = []
        for (const file of files) {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", "lightingpower")
            const data = await fetchAPI("/admin/upload/image", {
                method: "POST",
                body: formData,
            })
            uploadedUrls.push(data.secure_url)
        }
        return uploadedUrls
    }, [])

    const handleImageSelect = (file: File, index: number) => {
        const newFiles = [...imageFiles]
        newFiles[index] = file
        setImageFiles(newFiles)
        const reader = new FileReader()
        reader.onloadend = () => {
            const newPreviews = [...imageFilesPreview]
            newPreviews[index] = reader.result as string
            setImageFilesPreview(newPreviews)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (values: any) => {
        try {
            setIsSubmitting(true)
            const uploadedImageUrls = await uploadImagesToCloudinary(
                imageFiles.filter((f) => f),
            )

            const formData: Partial<IProduct> = {
                name: values.name,
                sku: values.sku,
                description,
                shortDescription: values.shortDescription,
                categoryId: values.categoryId,
                price: values.price,
                stock: values.stock,
                manufacturer: values.manufacturer,
                origin: values.origin,
                unit: values.unit,
                minOrderQuantity: values.minOrderQuantity,
                lowStockThreshold: values.lowStockThreshold,
                status: values.status,
                isFeatured: values.isFeatured ?? false,
                tags: values.tags || [],
                images: [
                    ...(productData?.data?.images ?? []).filter((i: string) =>
                        imageFilesPreview.includes(i),
                    ),
                    ...uploadedImageUrls,
                ],
                priceTiers: priceTiers.length ? priceTiers : undefined,
                specifications: specifications.length
                    ? specifications
                    : undefined,
                relatedProducts:
                    selectedRelatedProducts.length > 0
                        ? selectedRelatedProducts
                        : undefined,
            }

            if (isEdit) {
                await updateProductAsync({ id, data: formData })
                showMessage.success("Cáº­p nháº­t sáº£n pháº©m thÃ nh cÃ´ng!")
            } else {
                await createProductAsync(formData)
                showMessage.success("Táº¡o sáº£n pháº©m thÃ nh cÃ´ng!")
            }
            router.push(routes.boothProduct.url)
        } catch (error: any) {
            showMessage.error(error?.message || "CÃ³ lá»—i xáº£y ra!")
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        setBreadcrumb([
            { title: routes.boothProduct.title, href: routes.boothProduct.url },
            { title: isEdit ? "Cáº­p nháº­t" : "Táº¡o má»›i" },
        ])
    }, [isEdit, setBreadcrumb])

    useEffect(() => {
        if (isEdit && productData?.data) {
            const product = productData.data
            form.setFieldsValue({
                name: product.name,
                sku: product.sku,
                shortDescription: product.shortDescription,
                categoryId: product.categoryId,
                manufacturer: product.manufacturer,
                origin: product.origin,
                price: product.price,
                stock: product.stock,
                lowStockThreshold: product.lowStockThreshold,
                unit: product.unit,
                minOrderQuantity: product.minOrderQuantity,
                status: product.status,
                isFeatured: product.isFeatured,
                tags: product.tags || [],
            })
            setDescription(product.description || "")
            setImageFilesPreview(product.images || [])
            setSelectedRelatedProducts(
                (product.relatedProducts || []).map((i: IProduct) => i._id),
            )
        }
    }, [isEdit, productData, form])

    const isLoading = isLoadingProduct || isLoadingProducts

    return (
        <Card
            variant="borderless"
            className="max-w-full rounded-xl shadow-sm max-h-fit"
            loading={isLoading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    status: EProductStatus.draft,
                    isFeatured: false,
                    unit: "cÃ¡i",
                    minOrderQuantity: 1,
                    lowStockThreshold: 10,
                }}
            >
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="name" rules={[{ required: true }]}>
                            <FloatingInput required label="TÃªn sáº£n pháº©m" />
                        </Form.Item>
                        <Form.Item name="categoryId" rules={[{ required: true }]}>
                            <FloatingSelect
                                required
                                label="Danh má»¥c"
                                options={convertNestedCategories(
                                    categoriesList.filter(
                                        (i: ICategory) => i.childrenCount === 0,
                                    ),
                                )}
                            />
                        </Form.Item>
                        <Form.Item name="manufacturer">
                            <FloatingInput label="HÃ£ng sáº£n xuáº¥t" />
                        </Form.Item>
                        <Form.Item name="origin">
                            <FloatingInput label="Xuáº¥t xá»©" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="sku" rules={[{ required: true }]}>
                            <FloatingInput
                                required
                                label="SKU"
                                onChange={(e) =>
                                    form.setFieldValue(
                                        "sku",
                                        e.target.value?.toUpperCase() || "",
                                    )
                                }
                            />
                        </Form.Item>
                        <Form.Item name="price" rules={[{ required: true }]}>
                            <FloatingInputNumber
                                required
                                label="GiÃ¡ (Ä‘)"
                                min={0}
                                className="w-full rounded-lg h-[43px]"
                            />
                        </Form.Item>
                        <Form.Item name="stock" rules={[{ required: true }]}>
                            <FloatingInputNumber
                                required
                                label="Tá»“n kho"
                                min={0}
                                className="w-full rounded-lg h-[43px]"
                            />
                        </Form.Item>
                        <Form.Item name="unit">
                            <FloatingInput label="ÄÆ¡n vá»‹" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="shortDescription">
                            <FloatingTextArea rows={4} label="MÃ´ táº£ ngáº¯n" />
                        </Form.Item>
                        <Form.Item name="minOrderQuantity">
                            <FloatingInputNumber
                                label="Sá»‘ lÆ°á»£ng tá»‘i thiá»ƒu"
                                min={1}
                                className="w-full rounded-lg h-[43px]"
                            />
                        </Form.Item>
                        <Form.Item name="lowStockThreshold">
                            <FloatingInputNumber
                                label="NgÆ°á»¡ng cáº£nh bÃ¡o tá»“n kho"
                                min={0}
                                className="w-full rounded-lg h-[43px]"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <div className="font-semibold mb-2">MÃ´ táº£ chi tiáº¿t</div>
                <SimpleEditor
                    value={generateJSON(description || "", [StarterKit, Image])}
                    placeholder="Nháº­p mÃ´ táº£ chi tiáº¿t sáº£n pháº©m"
                    setUploading={setIsSubmitting}
                    onChange={(value: any) => setDescription(value)}
                />

                <div className="mt-6 border-t pt-6">
                    <PriceTiers
                        priceTiers={priceTiers}
                        newPriceTier={newPriceTier}
                        onAddTier={() =>
                            addPriceTier(
                                (tier) =>
                                    !!(
                                        tier.minQuantity &&
                                        tier.minQuantity > 0 &&
                                        tier.price &&
                                        tier.price > 0
                                    ),
                            )
                        }
                        onDeleteTier={deletePriceTier}
                        onUpdateField={updatePriceTierField}
                    />
                </div>

                <div className="mt-6 border-t pt-6">
                    <Specifications
                        specifications={specifications}
                        newSpecification={newSpecification}
                        onAddTier={() =>
                            addSpecification(
                                (spec) => !!(spec.name && spec.value),
                            )
                        }
                        onDeleteTier={deleteSpecification}
                        onUpdateField={updateSpecificationField}
                    />
                </div>

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">HÃ¬nh áº£nh</h3>
                    {imageFilesPreview.map((preview, idx) => (
                        <div key={idx} className="flex gap-2 mb-3">
                            {preview ? (
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    className="w-full"
                                >
                                    <Flex align="center" gap={10}>
                                        <img
                                            src={preview}
                                            alt={`product-${idx}`}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    </Flex>
                                    <Button
                                        danger
                                        size="small"
                                        icon={<X size={16} />}
                                        onClick={() => {
                                            setImageFilesPreview((prev) =>
                                                prev.filter((_, i) => i !== idx),
                                            )
                                            setImageFiles((prev) =>
                                                prev.filter((_, i) => i !== idx),
                                            )
                                        }}
                                        className="rounded-lg"
                                    />
                                </Flex>
                            ) : null}
                        </div>
                    ))}
                    <Upload
                        multiple
                        beforeUpload={(file) => {
                            const idx = imageFilesPreview.length
                            setImageFiles((prev) => [...prev, file])
                            setImageFilesPreview((prev) => [...prev, ""])
                            handleImageSelect(file, idx)
                            return false
                        }}
                        accept="image/*"
                    >
                        <Button icon={<Plus size={16} />}>ThÃªm áº£nh</Button>
                    </Upload>
                </div>

                <div className="mt-6 border-t pt-6 grid grid-cols-2 gap-6">
                    <Form.Item name="status">
                        <FloatingSelect
                            label="Tráº¡ng thÃ¡i"
                            options={PRODUCT_STATUS_OPTIONS}
                        />
                    </Form.Item>
                    <Form.Item name="isFeatured" valuePropName="checked">
                        <Switch checkedChildren="Ná»•i báº­t" unCheckedChildren="ThÆ°á»ng" />
                    </Form.Item>
                    <Form.Item name="tags">
                        <Checkbox.Group options={PRODUCT_TAG_OPTIONS} />
                    </Form.Item>
                    <div>
                        <div className="mb-2 font-medium">Sáº£n pháº©m liÃªn quan</div>
                        <Select
                            mode="multiple"
                            value={selectedRelatedProducts}
                            onChange={setSelectedRelatedProducts}
                            options={relatedProductsList}
                            className="w-full"
                            placeholder="Chá»n sáº£n pháº©m liÃªn quan"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button onClick={() => router.back()} className="rounded-lg px-6">
                        Há»§y
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting || isCreating || isUpdating}
                        className="rounded-lg px-6 bg-blue-500 hover:bg-blue-600"
                    >
                        {isEdit ? "Cáº­p nháº­t" : "Táº¡o má»›i"}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}
