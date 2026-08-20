'use client'

import { useState } from "react"
import { Form, Input, InputNumber, Select, Button, Card, message, Upload } from "antd"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"

export default function DangBanPage() {
    const t = useTranslations('c2c')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [form] = Form.useForm()
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imageFilesPreview, setImageFilesPreview] = useState<string[]>([])

    const handleImageSelect = (file: File) => {
        if (imageFiles.length >= 5) {
            message.warning(t('maxImages'))
            return false
        }
        const newFiles = [...imageFiles, file]
        setImageFiles(newFiles)

        const reader = new FileReader()
        reader.onloadend = () => {
            setImageFilesPreview([...imageFilesPreview, reader.result as string])
        }
        reader.readAsDataURL(file)
        return false
    }

    const handleRemoveImage = (index: number) => {
        setImageFiles(imageFiles.filter((_, i) => i !== index))
        setImageFilesPreview(imageFilesPreview.filter((_, i) => i !== index))
    }

    const uploadImages = async (files: File[]): Promise<string[]> => {
        const uploadedUrls: string[] = []
        for (const file of files) {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", "lightingpower_c2c")

            const res = await fetch("/api/admin/upload/image", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (data.success) {
                uploadedUrls.push(data.secure_url)
            } else {
                throw new Error(data.message || t('uploadImageError'))
            }
        }
        return uploadedUrls
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            let uploadedImages: string[] = []
            if (imageFiles.length > 0) {
                message.loading({ content: t('uploadingImages'), key: 'upload' })
                uploadedImages = await uploadImages(imageFiles)
                message.success({ content: t('uploadImagesSuccess'), key: 'upload' })
            }

            const payload = {
                title: values.title,
                price: values.price,
                condition: values.condition,
                contactInfo: values.contactInfo,
                description: values.description,
                images: uploadedImages
            }

            const res = await fetch("/api/c2c/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                message.success(t('postAdSuccess'))
                router.push("/") // Về trang chủ C2C
            } else {
                throw new Error(data.message)
            }
        } catch (error: any) {
            message.error(error.message || t('errorOccurred'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{t('postProductAd')}</h2>
            <Card>
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Form.Item name="title" label={t('title')} rules={[{ required: true, message: t('titleRequired') }]}>
                        <Input placeholder={t('titlePlaceholder')} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-20">
                        <Form.Item name="price" label={t('priceVnd')} rules={[{ required: true, message: t('priceRequired') }]}>
                            <InputNumber
                                controls={false}
                                className="!w-full"
                                min={0}
                                placeholder="VD: 50,000"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                            />
                        </Form.Item>
                        <Form.Item name="condition" label={t('condition')} initialValue="used">
                            <Select options={[
                                { label: t('conditionNew'), value: 'new' },
                                { label: t('conditionLikeNew'), value: 'like_new' },
                                { label: t('conditionUsed'), value: 'used' },
                            ]} />
                        </Form.Item>
                    </div>

                    <Form.Item name="contactInfo" label={t('contactPhone')} rules={[{ required: true, message: t('contactRequired') }]}>
                        <Input placeholder={t('contactPlaceholder')} />
                    </Form.Item>

                    <Form.Item name="description" label={t('descriptionDetail')}>
                        <SimpleEditor placeholder={t('descriptionPlaceholder')} setUploading={setLoading} />
                    </Form.Item>

                    <Form.Item label={t('imagesMax5')}>
                        <div className="flex gap-4">
                            {imageFilesPreview.map((preview, idx) => (
                                <div key={idx} className="relative w-24 h-24 border border-gray-200 rounded overflow-hidden shadow-sm">
                                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full hover:bg-white text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {imageFiles.length < 5 && (
                                <Upload
                                    beforeUpload={handleImageSelect}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:text-blue-500 text-gray-500 transition-colors bg-gray-50">
                                        <Plus size={20} className="mb-1" />
                                        <span className="text-xs font-medium">{t('uploadImageBtn')}</span>
                                    </div>
                                </Upload>
                            )}
                        </div>
                    </Form.Item>

                    <Form.Item className="mb-0 mt-6">
                        <Button type="primary" htmlType="submit" loading={loading} className="w-full !bg-[var(--brand-btn-bg)] hover:!bg-[var(--brand-btn-hover)] !border-none h-10 text-lg transition-colors">
                            {t('postAd')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
