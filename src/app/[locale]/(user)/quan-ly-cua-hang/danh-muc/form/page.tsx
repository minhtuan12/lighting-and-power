"use client"

import {
    FloatingCascader,
    FloatingInput,
    FloatingTextArea,
} from "@/components/inputs/FloatingInputs"
import { routes } from "@/constants/routes"
import { useBoothCategories } from "@/hooks/user/use-booth-categories"
import { showMessage } from "@/hooks/use-message"
import { fetchAPI } from "@/lib/api-client"
import {
    buildTree,
    convertNestedCategories,
    getParentCategoriesChain,
} from "@/lib/utils"
import { breadcrumbAtom } from "@/stores/ui"
import { ICategory } from "@/types/category"
import { Button, Card, Form, Switch, Upload } from "antd"
import { useSetAtom } from "jotai"
import { Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const BoothCategoryForm = () => {
    const router = useRouter()
    const setBreadcrumb = useSetAtom(breadcrumbAtom)
    const searchParams = useSearchParams()
    const categoryId = searchParams.get("id")
    const isEdit = !!categoryId

    const [form] = Form.useForm()
    const [parentCategories, setParentCategories] = useState<ICategory[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageFilePreview, setImageFilePreview] = useState<string>("")
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const {
        categories: allCategories,
        isLoading: isLoadingCategories,
        createCategoryAsync,
        updateCategoryAsync,
        isCreating,
        isUpdating,
    } = useBoothCategories({ view: "list" })

    const { getCategoryById } = useBoothCategories()
    const { data: categoryData, isLoading: isLoadingCategory } = categoryId
        ? getCategoryById(categoryId)
        : { data: null, isLoading: false }

    const findCategoryById = (id: string): ICategory | undefined =>
        allCategories?.data?.find((cat: ICategory) => cat._id === id)

    const handleParentChange = (
        value: (string | number | null)[],
        selectOptions: any[],
    ) => {
        const parentId =
            value && value.length > 0 ? value[value.length - 1] : undefined
        if (parentId) {
            const selectedParent = findCategoryById(parentId as string)
            if (selectedParent && !selectedParent.isActive) {
                form.setFieldValue("isActive", false)
            }
        }
    }

    const uploadImagesToCloudinary = useCallback(
        async (file: File): Promise<string> => {
            setIsUploadingImage(true)
            try {
                const formData = new FormData()
                formData.append("file", file)
                formData.append("folder", "lightingpower")

                const data = await fetchAPI("/admin/upload/image", {
                    method: "POST",
                    body: formData,
                })
                return data.secure_url
            } catch (error: any) {
                console.error("Image upload error:", error)
                throw new Error(error.message || "Failed to upload images")
            } finally {
                setIsUploadingImage(false)
            }
        },
        [],
    )

    const handleSubmit = async (values: any) => {
        try {
            let uploadedImageUrl: string = ""
            if (imageFile && typeof imageFile !== "string") {
                showMessage.loading("Äang táº£i áº£nh lÃªn...")
                uploadedImageUrl = await uploadImagesToCloudinary(imageFile)
            }
            const formData: Partial<ICategory> = {
                name: values.name,
                image:
                    uploadedImageUrl || categoryData?.data?.image || imageFile,
                description: values.description,
                parentId: Array.isArray(values.parentId)
                    ? values.parentId?.[values.parentId?.length - 1] || null
                    : values.parentId,
                isActive: values.isActive ?? true,
                metaTitle: values.metaTitle,
                metaDescription: values.metaDescription,
                metaKeywords: values.metaKeywords,
            }

            if (isEdit && categoryId) {
                await updateCategoryAsync({
                    id: categoryId,
                    data: formData as Partial<ICategory>,
                })
                showMessage.success("Cáº­p nháº­t danh má»¥c thÃ nh cÃ´ng!")
            } else {
                await createCategoryAsync(formData as Partial<ICategory>)
                showMessage.success("Táº¡o danh má»¥c thÃ nh cÃ´ng!")
            }

            router.push(routes.boothCategory.url)
        } catch (error: any) {
            showMessage.error(error?.message || "CÃ³ lá»—i xáº£y ra!")
        }
    }

    const handleImageSelect = useCallback((file: File) => {
        setImageFile(file)

        const reader = new FileReader()
        reader.onloadend = () => {
            setImageFilePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }, [])

    const isLoading = isLoadingCategory || isLoadingCategories
    const isSubmitting = isCreating || isUpdating || isUploadingImage

    useEffect(() => {
        setBreadcrumb([
            {
                key: routes.boothCategory.url,
                href: routes.boothCategory.url,
                title: routes.boothCategory.title,
            },
            {
                key: "form",
                title: isEdit ? "Cáº­p nháº­t danh má»¥c" : "Táº¡o má»›i danh má»¥c",
            },
        ])
    }, [isEdit, setBreadcrumb])

    useEffect(() => {
        if (allCategories?.data) {
            const parents = allCategories.data.filter(
                (cat: ICategory) =>
                    cat.level <= 1 && (!isEdit || cat._id !== categoryId),
            )
            setParentCategories(parents)
        }
    }, [allCategories, categoryId, isEdit])

    useEffect(() => {
        if (isEdit && categoryData?.data) {
            const category = categoryData.data
            form.setFieldsValue({
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: getParentCategoriesChain(
                    parentCategories,
                    category.parentId,
                ),
                isActive: category.isActive,
                metaTitle: category.metaTitle,
                metaDescription: category.metaDescription,
                metaKeywords: category.metaKeywords,
            })

            setImageFilePreview(category.image)
            setImageFile(null)
        }
    }, [isEdit, categoryData, form, parentCategories])

    return (
        <Card
            variant="borderless"
            className="max-w-full mx-auto rounded-xl shadow-sm h-full"
            loading={isLoading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    isActive: true,
                }}
            >
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-8">
                        <Form.Item
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lÃ²ng nháº­p tÃªn danh má»¥c!",
                                },
                            ]}
                        >
                            <FloatingInput
                                required
                                label="TÃªn danh má»¥c"
                                size="large"
                                placeholder="Nháº­p tÃªn danh má»¥c"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item name="description">
                            <FloatingTextArea
                                label="MÃ´ táº£"
                                rows={4}
                                placeholder="Nháº­p mÃ´ táº£ danh má»¥c"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item name="parentId">
                            <FloatingCascader
                                label="Danh má»¥c cha"
                                size="large"
                                placeholder="Chá»n danh má»¥c cha (náº¿u cÃ³)"
                                className="rounded-lg"
                                allowClear
                                changeOnSelect
                                options={convertNestedCategories(
                                    buildTree(parentCategories),
                                )}
                                onChange={handleParentChange}
                            />
                        </Form.Item>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                HÃ¬nh áº£nh
                            </h3>
                            <div className="space-y-4">
                                <Upload
                                    maxCount={1}
                                    beforeUpload={(file) => {
                                        handleImageSelect(file)
                                        return false
                                    }}
                                    accept="image/*"
                                    className="cursor-pointer"
                                    rootClassName="!w-fit"
                                >
                                    {imageFilePreview ? (
                                        <img
                                            src={imageFilePreview}
                                            className="object-cover rounded w-20 h-20 border"
                                        />
                                    ) : (
                                        <div className="p-3 border-2 border-dashed border-gray-300 rounded text-center hover:border-blue-400 transition-colors cursor-pointer">
                                            <Plus
                                                size={16}
                                                className="mx-auto text-gray-400 mb-1"
                                            />
                                            <p className="text-xs text-gray-600">
                                                Upload áº£nh
                                            </p>
                                        </div>
                                    )}
                                </Upload>
                            </div>
                        </div>

                        <Form.Item
                            label={
                                <span className="font-semibold">
                                    Tráº¡ng thÃ¡i
                                </span>
                            }
                            name="isActive"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Hiá»‡n"
                                unCheckedChildren="áº¨n"
                            />
                        </Form.Item>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <h3 className="font-semibold text-gray-900">
                                SEO Meta Tags
                            </h3>

                            <Form.Item name="metaTitle">
                                <FloatingInput
                                    label="Meta Title"
                                    placeholder="Nháº­p meta title"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item name="metaDescription">
                                <FloatingTextArea
                                    label="Meta Description"
                                    rows={3}
                                    placeholder="Nháº­p meta description"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item name="metaKeywords">
                                <FloatingInput
                                    label="Meta Keywords"
                                    placeholder="Nháº­p meta keywords (ngÄƒn cÃ¡ch bá»Ÿi dáº¥u pháº©y)"
                                    className="rounded-lg"
                                />
                            </Form.Item>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-20 border-t">
                    <Button
                        onClick={() => router.back()}
                        className="rounded-lg px-6"
                    >
                        Há»§y
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        className="rounded-lg px-6 bg-blue-500 hover:bg-blue-600"
                    >
                        {isEdit ? "Cáº­p nháº­t" : "Táº¡o má»›i"}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}

export default BoothCategoryForm
