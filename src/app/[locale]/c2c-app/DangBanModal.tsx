'use client'

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import {
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Upload,
    message
} from 'antd'
import { ImagePlus, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

type Product = { _id: string; title: string; price: number; condition: string; contactInfo?: string; description?: string; images?: string[] }
type ImageItem = { preview: string; file?: File; url?: string }
type Props = { open: boolean; onClose: () => void; onSuccess: () => void; product?: Product | null }

export default function DangBanModal({ open, onClose, onSuccess, product = null }: Props) {
    const t = useTranslations('c2c')
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<ImageItem[]>([])

    useEffect(() => {
        if (!open) return
        form.setFieldsValue(product ? { title: product.title, price: product.price, condition: product.condition, contactInfo: product.contactInfo, description: product.description } : { condition: 'used' })
        setImages(product?.images?.map((url) => ({ preview: url, url })) || [])
    }, [open, product, form])

    const reset = () => {
        form.resetFields()
        setImages([])
    }
    const close = () => {
        if (!loading) {
            reset()
            onClose()
        }
    }
    const selectImage = (file: File) => {
        if (images.length >= 5) {
            message.warning(t('maxImages'))
            return false
        }
        const reader = new FileReader()
        reader.onloadend = () =>
            setImages((items) => [...items, { preview: reader.result as string, file }])
        reader.readAsDataURL(file)
        return false
    }
    const removeImage = (index: number) => {
        setImages((items) => items.filter((_, i) => i !== index))
    }
    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            const uploadedImages: string[] = []
            for (const item of images) {
                if (!item.file) continue
                const file = item.file
                const body = new FormData()
                body.append('file', file)
                body.append('folder', 'lightingpower_c2c')
                const upload = await fetch('/api/admin/upload/image', {
                    method: 'POST',
                    body,
                })
                const result = await upload.json()
                if (!result.success)
                    throw new Error(result.message || t('uploadImageError'))
                uploadedImages.push(result.secure_url)
            }
            const response = await fetch(product ? `/api/c2c/products/${product._id}` : '/api/c2c/products', {
                method: product ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, images: [...images.filter((item) => item.url).map((item) => item.url), ...uploadedImages] }),
            })
            const result = await response.json()
            if (!result.success) throw new Error(result.message)
            message.success(t('postAdSuccess'))
            reset()
            onSuccess()
        } catch (error: any) {
            message.error(error.message || t('errorOccurred'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            centered
            width={760}
            height={300}
            destroyOnHidden
            title={<span className="text-xl font-bold text-[#082c40]">{product ? t('edit') : t('postProductAd')}</span>}
        >
            <Form layout="vertical" form={form} onFinish={onFinish} className="!mt-4">
                <div className="flex gap-5 max-md:flex-col">
                    {/* Left: images */}
                    <div className="w-[200px] flex-none max-md:w-full">
                        <div className="mb-2 text-[13px] text-[#082c40]">
                            {t('imagesMax5')}
                        </div>

                        {images[0] ? (
                            <div className="relative mb-2 h-[200px] w-full overflow-hidden rounded-lg border border-[#e2e7eb]">
                                <img src={images[0].preview} alt="preview" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(0)}
                                    className="absolute right-1.5 top-1.5 cursor-pointer rounded-full bg-white/90 p-1 text-red-500"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ) : (
                            <Upload beforeUpload={selectImage} showUploadList={false} accept="image/*">
                                <div className="mb-2 flex h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#e2e7eb] text-gray-400 hover:border-[#218daf] hover:text-[#218daf]">
                                    <ImagePlus size={26} />
                                    <span className="text-xs">{t('uploadImageBtn')}</span>
                                </div>
                            </Upload>
                        )}

                        <div className="grid grid-cols-4 gap-1.5">
                            {images.slice(1).map((image, i) => {
                                const index = i + 1
                                return (
                                    <div
                                        key={index}
                                        className="relative aspect-square overflow-hidden rounded-md border border-[#e2e7eb]"
                                    >
                                        <img src={image.preview} alt="preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-0.5 top-0.5 cursor-pointer rounded-full bg-white/90 p-0.5 text-red-500"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                )
                            })}
                            {images.length > 0 && images.length < 5 && (
                                <Upload beforeUpload={selectImage} showUploadList={false} accept="image/*">
                                    <div className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed border-[#e2e7eb] text-gray-400 hover:border-[#218daf] hover:text-[#218daf]">
                                        <Plus size={14} />
                                    </div>
                                </Upload>
                            )}
                        </div>
                    </div>

                    {/* Right: fields */}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <Form.Item
                            name="title"
                            label={t('title')}
                            rules={[{ required: true, message: t('titleRequired') }]}
                        >
                            <Input placeholder={t('titlePlaceholder')} />
                        </Form.Item>
                        <div className="flex gap-3">
                            <Form.Item
                                name="price"
                                label={t('priceVnd')}
                                rules={[{ required: true, message: t('priceRequired') }]}
                                className="flex-1"
                            >
                                <InputNumber
                                    controls={false}
                                    className="!w-full"
                                    min={0}
                                    placeholder="VD: 50,000"
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                                />
                            </Form.Item>
                            <Form.Item
                                name="condition"
                                label={t('condition')}
                                initialValue="used"
                                className="flex-1"
                            >
                                <Select
                                    options={[
                                        { label: t('conditionNew'), value: 'new' },
                                        { label: t('conditionLikeNew'), value: 'like_new' },
                                        { label: t('conditionUsed'), value: 'used' },
                                    ]}
                                />
                            </Form.Item>
                        </div>
                        <Form.Item
                            name="contactInfo"
                            label={t('contactPhone')}
                            rules={[{ required: true, message: t('contactRequired') }]}
                        >
                            <Input placeholder={t('contactPlaceholder')} />
                        </Form.Item>
                    </div>
                </div>

                <Form.Item name="description" label={t('descriptionDetail')} className='!mt-4'>
                    <SimpleEditor
                        placeholder={t('descriptionPlaceholder')}
                        setUploading={setLoading}
                        className='!max-h-[200px] !min-h-[200px] max-md:!mt-12'
                    />
                </Form.Item>

                <div className="mt-1 flex justify-end gap-2">
                    <Button onClick={close} disabled={loading} className="!rounded-full !border-[#e2e7eb] !px-5">
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="!rounded-full !border-none !bg-[#f4511e] !px-6"
                    >
                        {t('postAd')}
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}
