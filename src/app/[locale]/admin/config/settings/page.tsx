"use client"

import { FloatingInput } from "@/components/inputs/FloatingInputs"
import { routes } from "@/constants/routes"
import { useConfig } from "@/hooks/admin/use-config"
import { showMessage } from "@/hooks/use-message"
import { fetchAPI } from "@/lib/api-client"
import { breadcrumbAtom } from "@/stores"
import { IConfig } from "@/types/config"
import { Button, Card, Col, Flex, Form, Row, Space, Upload } from "antd"
import { useSetAtom } from "jotai"
import { Plus, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const social = [
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "Youtube" },
    { value: "tiktok", label: "Tiktok" },
    { value: "zalo", label: "Zalo" },
    { value: "telegram", label: "Telegram" },
]

export const Settings = () => {
    const [form] = Form.useForm()
    const setBreadcrumb = useSetAtom(breadcrumbAtom)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imageFilesPreview, setImageFilesPreview] = useState<string[]>([])

    const { isLoading, isUpdating, updateConfigAsync, config } = useConfig()

    const uploadImagesToCloudinary = useCallback(
        async (files: File[]): Promise<string[]> => {
            try {
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
            } catch (error: any) {
                console.error("Image upload error:", error)
                throw new Error(error.message || "Failed to upload images")
            }
        },
        [],
    )

    const handleImageSelect = useCallback(
        (file: File, index: number) => {
            const newFiles = [...imageFiles]
            newFiles[index] = file
            setImageFiles(newFiles)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                const newPreviews = [...imageFilesPreview]
                newPreviews[index] = reader.result as string
                setImageFilesPreview(newPreviews)
            }
            reader.readAsDataURL(file)
        },
        [imageFiles, imageFilesPreview],
    )

    const handleAddImage = useCallback(() => {
        setImageFiles([...imageFiles, null as any])
        setImageFilesPreview([...imageFilesPreview, ""])
    }, [imageFiles, imageFilesPreview])

    const handleRemoveImageField = useCallback(
        (index: number) => {
            setImageFiles(imageFiles.filter((_, i) => i !== index))
            setImageFilesPreview(
                imageFilesPreview.filter((_, i) => i !== index),
            )
        },
        [imageFiles, imageFilesPreview],
    )

    const handleSubmit = async (values: any) => {
        try {
            let uploadedImageUrls: string[] = []
            const validFiles = imageFiles.filter(
                (f) => f !== null && f !== undefined,
            )
            uploadedImageUrls = await uploadImagesToCloudinary(validFiles)
            showMessage.loading("Đang tải ảnh lên...")

            let configData: Omit<IConfig, "_id"> = {
                companyName: values.companyName,
                hotline: values.hotline,
                email: values.email,
                address: values.address,
                workingHours: values.workingHours,
                social: {
                    facebook: values.facebook,
                    youtube: values.youtube,
                    tiktok: values.tiktok,
                    zalo: values.zalo,
                    telegram: values.telegram,
                },
                banners: [
                    ...config?.banners?.filter((i: string) =>
                        imageFilesPreview.includes(i),
                    ),
                    ...uploadedImageUrls,
                ],
            }

            await updateConfigAsync({ data: configData })
            showMessage.success("Cập nhật thành công")
        } catch (error: any) {
            showMessage.error(error.message || "Có lỗi xảy ra")
        }
    }

    useEffect(() => {
        setBreadcrumb([{ title: routes.config.title }])
    }, [setBreadcrumb])

    useEffect(() => {
        if (config) {
            form.setFieldsValue({
                companyName: config.companyName,
                hotline: config.hotline,
                email: config.email,
                address: config.address,
                workingHours: config.workingHours,
                social: config.social,
            })

            if (config.banners && config.banners.length > 0) {
                setImageFilesPreview(config.banners)
                setImageFiles([])
            }
        }
    }, [config?._id])

    return (
        <Card
            variant="borderless"
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
            loading={isLoading}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Row gutter={64}>
                    <Col span={12}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Thông tin
                        </h3>
                        <Row gutter={32}>
                            <Col span={24}>
                                <Form.Item
                                    name="companyName"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập tên công ty",
                                        },
                                    ]}
                                >
                                    <FloatingInput
                                        required
                                        label="Tên công ty"
                                        placeholder="Nhập tên công ty"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="hotline"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập hotline",
                                        },
                                    ]}
                                >
                                    <FloatingInput
                                        required
                                        label="Hotline"
                                        placeholder="Hotline"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập email",
                                        },
                                    ]}
                                >
                                    <FloatingInput
                                        required
                                        label="Email"
                                        placeholder="Email"
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="address"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập địa chỉ",
                                        },
                                    ]}
                                >
                                    <FloatingInput
                                        required
                                        label="Địa chỉ"
                                        placeholder="Địa chỉ"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="workingHours"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập giờ làm việc",
                                        },
                                    ]}
                                >
                                    <FloatingInput
                                        required
                                        label="Giờ làm việc"
                                        placeholder="Giờ làm việc"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Liên hệ
                        </h3>
                        {social.map(({ label, value }) => (
                            <Row key={label}>
                                <Col span={24}>
                                    <Form.Item name={value}>
                                        <FloatingInput
                                            label={label}
                                            placeholder={`Link ${label}`}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        ))}
                    </Col>
                </Row>

                <Row>
                    <Flex vertical gap={10}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Hình ảnh
                        </h3>
                        <div className="space-y-4">
                            {imageFilesPreview.map((preview, idx) => (
                                <div key={idx} className="flex gap-2 mb-3">
                                    {preview ? (
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            className="w-full"
                                            gap={15}
                                        >
                                            <Flex align="center" gap={10}>
                                                <img
                                                    src={preview}
                                                    alt={`product-${idx}`}
                                                    className="w-92 h-30 object-cover rounded"
                                                />
                                                <p className="text-xs font-semibold">
                                                    ✓ Uploaded
                                                </p>
                                            </Flex>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<X size={16} />}
                                                onClick={() =>
                                                    handleRemoveImageField(idx)
                                                }
                                                className="rounded-lg"
                                            />
                                        </Flex>
                                    ) : (
                                        <>
                                            <Upload
                                                maxCount={1}
                                                beforeUpload={(file) => {
                                                    handleImageSelect(file, idx)
                                                    return false
                                                }}
                                                accept="image/*"
                                                className="flex-1"
                                            >
                                                <div className="p-3 border-2 border-dashed border-gray-300 rounded text-center hover:border-blue-400 transition-colors cursor-pointer">
                                                    <Plus
                                                        size={16}
                                                        className="mx-auto text-gray-400 mb-1"
                                                    />
                                                    <p className="text-xs text-gray-600">
                                                        Upload ảnh
                                                    </p>
                                                </div>
                                            </Upload>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<X size={16} />}
                                                onClick={() =>
                                                    handleRemoveImageField(idx)
                                                }
                                                className="rounded-lg"
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                icon={<Plus size={16} />}
                                onClick={handleAddImage}
                                className="w-full rounded-lg mt-2"
                            >
                                Thêm ảnh
                            </Button>
                        </div>
                    </Flex>
                </Row>

                <Form.Item>
                    <Space className="justify-end w-full">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isUpdating}
                        >
                            Cập nhật
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    )
}

export default Settings
