"use client"

import {
    FloatingCascader,
    FloatingInput,
    FloatingTextArea,
} from "@/components/inputs/FloatingInputs"
import { routes } from "@/constants/routes"
import { useCategories } from "@/hooks/admin/use-categories"
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

const CategoryForm = () => {
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
    } = useCategories({ view: "list" })

    const { getCategoryById } = useCategories()
    const { data: categoryData, isLoading: isLoadingCategory } = categoryId
        ? getCategoryById(categoryId)
        : { data: null, isLoading: false }

    // Tìm category theo ID
    const findCategoryById = (id: string): ICategory | undefined => {
        return allCategories?.data?.find((cat: ICategory) => cat._id === id)
    }

    // Handle parent category change
    const handleParentChange = (
        value: (string | number | null)[],
        selectOptions: any[],
    ) => {
        const parentId =
            value && value.length > 0 ? value[value.length - 1] : undefined
        if (parentId) {
            const selectedParent = findCategoryById(parentId as string)

            // Nếu parent category có isActive = false, tự động set form isActive = false
            if (selectedParent && !selectedParent.isActive) {
                form.setFieldValue("isActive", false)
            }
        }
    }

    // ==================== Image Upload to Cloudinary ====================
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
            // Upload images first
            showMessage.loading("Đang tải ảnh lên...")
            let uploadedImageUrl: string = ""

            if (imageFile && typeof imageFile !== "string") {
                uploadedImageUrl = await uploadImagesToCloudinary(imageFile)
            }
            const formData: Partial<ICategory> = {
                name: values.name,
                image:
                    uploadedImageUrl ?? categoryData?.data?.image ?? imageFile,
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
                showMessage.success("Cập nhật danh mục thành công!")
            } else {
                await createCategoryAsync(formData as Partial<ICategory>)
                showMessage.success("Tạo danh mục thành công!")
            }

            router.push(routes.category.url)
        } catch (error: any) {
            showMessage.error(error?.message || "Có lỗi xảy ra!")
        }
    }

    const handleImageSelect = useCallback(
        (file: File) => {
            setImageFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImageFilePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        },
        [imageFile, imageFilePreview],
    )

    const isLoading = isLoadingCategory || isLoadingCategories
    const isSubmitting = isCreating || isUpdating || isUploadingImage

    useEffect(() => {
        setBreadcrumb([
            {
                key: routes.category.url,
                href: routes.category.url,
                title: routes.category.title,
            },

            {
                key: "form",
                title: isEdit ? "Cập nhật danh mục" : "Tạo mới danh mục",
            },
        ])
    }, [setBreadcrumb])

    // Load parent categories (chỉ lấy level 0 và 1)
    useEffect(() => {
        if (allCategories?.data) {
            const parents = allCategories.data.filter(
                (cat: ICategory) =>
                    cat.level <= 1 && (!isEdit || cat._id !== categoryId),
            )
            setParentCategories(parents)
        }
    }, [allCategories, categoryId, isEdit])

    // Load product data for edit
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
            {/* Form */}
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    isActive: true,
                }}
            >
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-8">
                        <Form.Item
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập tên danh mục!",
                                },
                            ]}
                        >
                            <FloatingInput
                                required
                                label="Tên danh mục"
                                size="large"
                                placeholder="Nhập tên danh mục"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item name="description">
                            <FloatingTextArea
                                label="Mô tả"
                                rows={4}
                                placeholder="Nhập mô tả danh mục"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item name="parentId">
                            <FloatingCascader
                                label="Danh mục cha"
                                size="large"
                                placeholder="Chọn danh mục cha (nếu có)"
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
                                Hình ảnh
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
                                                Upload ảnh
                                            </p>
                                        </div>
                                    )}
                                </Upload>
                            </div>
                        </div>

                        <Form.Item
                            label={
                                <span className="font-semibold">
                                    Trạng thái
                                </span>
                            }
                            name="isActive"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Hiện"
                                unCheckedChildren="Ẩn"
                            />
                        </Form.Item>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <h3 className="font-semibold text-gray-900">
                                SEO Meta Tags
                            </h3>

                            <Form.Item name="metaTitle">
                                <FloatingInput
                                    label="Meta Title"
                                    placeholder="Nhập meta title"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item name="metaDescription">
                                <FloatingTextArea
                                    label="Meta Description"
                                    rows={3}
                                    placeholder="Nhập meta description"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item name="metaKeywords">
                                <FloatingInput
                                    label="Meta Keywords"
                                    placeholder="Nhập meta keywords (ngăn cách bởi dấu phẩy)"
                                    className="rounded-lg"
                                />
                            </Form.Item>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-20 border-t">
                    <Button
                        onClick={() => router.back()}
                        className="rounded-lg px-6"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        className="rounded-lg px-6 bg-blue-500 hover:bg-blue-600"
                    >
                        {isEdit ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}

export default CategoryForm
