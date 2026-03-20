'use client'

import DefaultImage from '@/components/DefaultImage'
import {
    FloatingInput,
    FloatingSelect,
    FloatingTextArea,
} from '@/components/inputs/FloatingInputs'
import SearchBar from '@/components/SearchBar'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import {
    ALLOWED_FILE_TYPES,
    CONTENT_TYPES,
    MAX_FILE_SIZE,
    PAGE_LIMIT,
} from '@/constants/common'
import { useDocumentCategories } from '@/hooks/admin/use-document-categories'
import { useDocuments } from '@/hooks/admin/use-documents'
import useDebounce from '@/hooks/use-debounce'
import { showMessage } from '@/hooks/use-message'
import useUpload from '@/hooks/use-upload'
import { breadcrumbAtom, filterDocumentAtom } from '@/stores'
import { IDocument } from '@/types/document'
import { IDocumentCategory } from '@/types/document-category'
import { LoadingOutlined } from '@ant-design/icons'
import { generateJSON } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import {
    Button,
    Card,
    Col,
    Form,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Upload,
} from 'antd'
import { useAtom, useSetAtom } from 'jotai'
import { Download, Edit2, FileText, Filter, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

export const Documents = () => {
    const [form] = Form.useForm()
    const [categoryForm] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
    const [editingDocument, setEditingDocument] = useState<IDocument | null>(
        null,
    )
    const [editingCategory, setEditingCategory] =
        useState<IDocumentCategory | null>(null)
    const [contentType, setContentType] = useState<'text' | 'file'>('text')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loadingUploadImage, setLoadingUploadImage] = useState(false)
    const [content, setContent] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageFilePreview, setImageFilePreview] = useState<string>('')

    const { isUploadingImage, uploadImagesToCloudinary } = useUpload()
    const [filter, setFilter] = useAtom(filterDocumentAtom)
    const setBreadcrumb = useSetAtom(breadcrumbAtom)

    const {
        categories,
        isCreating: isCreatingCategory,
        isUpdating: isUpdatingCategory,
        isDeleting: isDeletingCategory,
        createCategoryAsync,
        updateCategoryAsync,
        deleteCategoryAsync,
    } = useDocumentCategories()

    const {
        documents: data,
        isLoading,
        isCreating,
        isUpdating,
        isUploading,
        isDeleting,
        createDocumentAsync,
        updateDocumentAsync,
        deleteDocumentAsync,
        uploadFileAsync,
    } = useDocuments({ ...filter })

    const handleOpenModal = (doc?: IDocument) => {
        if (!doc && categoryOptions.length === 0) {
            showMessage.warning('Vui lòng tạo danh mục thiết bị trước')
            setIsCategoryModalOpen(true)
            return
        }

        if (doc) {
            setEditingDocument(doc)
            setContentType(doc.contentType)
            setContent(doc.content ?? '')
            form.setFieldsValue({
                title: doc.title,
                description: doc.description,
                type: doc.type,
                contentType: doc.contentType,
                content: doc.content,
            })
        } else {
            setEditingDocument(null)
            setContentType('text')
            setContent('')
            form.setFieldsValue({
                title: '',
                description: '',
                type: filter.type || categoryOptions?.[0]?.value,
                contentType: 'text',
                content: '',
            })
        }
        setSelectedFile(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingDocument(null)
        setContentType('text')
        setContent('')
        setSelectedFile(null)
        form.resetFields()
    }

    const handleSubmit = async (values: any) => {
        try {
            let uploadedImageUrl: string = ''
            if (imageFile && typeof imageFile !== 'string') {
                uploadedImageUrl = await uploadImagesToCloudinary(imageFile)
            }

            let documentData: Omit<Partial<IDocument>, '_id'> = {
                title: values.title,
                description: values.description,
                type: values.type,
                contentType,
                isPublished: true,
                thumbnail:
                    uploadedImageUrl || (editingDocument?.thumbnail || null),
            }

            if (contentType === 'text') {
                // Text content
                documentData.content = content
            } else {
                // File upload
                if (!selectedFile && !editingDocument) {
                    showMessage.error('Vui lòng chọn file')
                    return
                }

                if (selectedFile) {
                    // Validate file
                    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
                        showMessage.error(
                            'Loại file không hỗ trợ. Chỉ PDF, Word, Text được chấp nhận',
                        )
                        return
                    }

                    if (selectedFile.size > MAX_FILE_SIZE) {
                        showMessage.error(
                            `File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                        )
                        return
                    }

                    // Upload file
                    const uploadResult = await uploadFileAsync({
                        file: selectedFile,
                        folder: 'lightingpower',
                    })

                    documentData.fileUrl = uploadResult.secure_url
                    documentData.fileName = selectedFile.name
                    documentData.fileSize = selectedFile.size
                    documentData.mimeType = selectedFile.type
                }
            }

            if (editingDocument) {
                await updateDocumentAsync({
                    id: editingDocument._id!,
                    data: documentData,
                })
                showMessage.success('Cập nhật mục thành công')
            } else {
                await createDocumentAsync(documentData as any)
                showMessage.success('Tạo mục thành công')
            }

            handleCloseModal()
        } catch (error: any) {
            showMessage.error(error.message || 'Có lỗi xảy ra')
        }
    }

    const handleDelete = async (record: IDocument) => {
        if (record._id) {
            try {
                await deleteDocumentAsync(record._id)
                showMessage.success('Xóa mục thành công')
            } catch (error: any) {
                showMessage.error(error.message || 'Lỗi xóa mục')
            }
        }
    }

    const handleOpenCategoryForm = (category?: IDocumentCategory) => {
        if (category) {
            setEditingCategory(category)
            categoryForm.setFieldsValue({
                name: category.name,
                description: category.description,
                color: category.color || 'blue',
                isPublished: category.isPublished ?? true,
            })
        } else {
            setEditingCategory(null)
            categoryForm.resetFields()
            categoryForm.setFieldsValue({
                color: 'blue',
                isPublished: true,
            })
        }
        setIsCategoryFormOpen(true)
    }

    const handleSubmitCategory = async (values: any) => {
        try {
            if (editingCategory?._id) {
                await updateCategoryAsync({
                    id: editingCategory._id,
                    data: values,
                })
                showMessage.success('Cập nhật danh mục thành công')
            } else {
                await createCategoryAsync(values)
                showMessage.success('Tạo danh mục thành công')
            }
            setIsCategoryFormOpen(false)
        } catch (error: any) {
            showMessage.error(error.message || 'Có lỗi xảy ra')
        }
    }

    const handleDeleteCategory = async (record: IDocumentCategory) => {
        if (!record._id) return
        try {
            await deleteCategoryAsync(record._id)
            showMessage.success('Xóa danh mục thành công')
        } catch (error: any) {
            showMessage.error(error.message || 'Không thể xóa danh mục')
        }
    }

    const handleUpdateCategoryStatus = async (
        status: boolean,
        record: IDocumentCategory,
    ) => {
        if (!record._id) return
        try {
            await updateCategoryAsync({
                id: record._id,
                data: {
                    name: record.name,
                    description: record.description,
                    color: record.color,
                    isPublished: status,
                    order: record.order,
                },
            })
            showMessage.success('Cập nhật danh mục thành công')
        } catch (error: any) {
            showMessage.error(error.message || 'Cập nhật danh mục thất bại')
        }
    }

    const handleUpdateStatus = async (status: boolean, record: IDocument) => {
        if (record._id) {
            setEditingDocument(record)
            try {
                await updateDocumentAsync({
                    id: String(record._id),
                    data: { ...record, isPublished: status },
                })
                showMessage.success('Cập nhật thành công')
            } catch (error: any) {
                showMessage.error(error.message || 'Đã có lỗi xảy ra')
            } finally {
                setEditingDocument(null)
            }
        }
    }

    const columns = [
        {
            title: 'Mục nội dung',
            dataIndex: 'title',
            key: 'title',
            width: 250,
            render: (text: string) => (
                <span className="font-semibold">{text}</span>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'type',
            key: 'type',
            width: 150,
            align: 'center',
            render: (type: string) => {
                const typeConfig = categoryMap.get(type)
                return (
                    <Tag
                        color={typeConfig?.color}
                        variant="outlined"
                    >
                        {typeConfig?.name || 'Khác'}
                    </Tag>
                )
            },
        },
        {
            title: 'Nội dung',
            dataIndex: 'contentType',
            key: 'contentType',
            width: 100,
            align: 'center',
            render: (contentType: string) => (
                <Tag
                    color={contentType === 'text' ? 'blue' : 'green'}
                    variant="outlined"
                >
                    {contentType === 'text' ? 'Văn bản' : 'File'}
                </Tag>
            ),
        },
        {
            title: 'Xuất bản',
            dataIndex: 'isPublished',
            key: 'isPublished',
            width: 100,
            align: 'center',
            render: (isPublished: boolean, record: IDocument) => (
                <Switch
                    loading={isUpdating && editingDocument?._id === record._id}
                    checked={isPublished}
                    onChange={(e) => handleUpdateStatus(e, record)}
                />
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: IDocument) => (
                <Space size={8}>
                    {record.contentType === 'file' && record.fileUrl && (
                        <Button
                            type="text"
                            size="small"
                            icon={<Download size={16} />}
                            onClick={() => {
                                const a = document.createElement('a')
                                a.href = record.fileUrl!
                                a.download = record.fileName || 'document'
                                a.click()
                            }}
                            title="Tải file"
                        />
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<Edit2 size={16} />}
                        onClick={() => handleOpenModal(record)}
                        title="Chỉnh sửa"
                    />
                    <Popconfirm
                        title="Xóa mục"
                        description="Bạn có chắc chắn muốn xóa?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDelete(record)}
                    >
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 size={16} />}
                            title="Xóa"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    const categoryColumns = useMemo(
        () => [
            {
                title: 'Danh mục',
                dataIndex: 'name',
                key: 'name',
                render: (text: string) => (
                    <div className="font-semibold text-gray-900">{text}</div>
                ),
            },
            {
                title: 'Màu',
                dataIndex: 'color',
                key: 'color',
                width: 120,
                align: 'center' as const,
                render: (color: string) => (
                    <Tag color={color} variant="outlined">
                        {color}
                    </Tag>
                ),
            },
            {
                title: 'Xuất bản',
                dataIndex: 'isPublished',
                key: 'isPublished',
                width: 120,
                align: 'center' as const,
                render: (isPublished: boolean, record: IDocumentCategory) => (
                    <Switch
                        checked={isPublished}
                        loading={
                            isUpdatingCategory &&
                            editingCategory?._id === record._id
                        }
                        onChange={(value) =>
                            handleUpdateCategoryStatus(value, record)
                        }
                    />
                ),
            },
            {
                title: 'Hành động',
                key: 'action',
                width: 140,
                align: 'center' as const,
                render: (_: any, record: IDocumentCategory) => (
                    <Space size={8}>
                        <Button
                            type="text"
                            size="small"
                            icon={<Edit2 size={16} />}
                            onClick={() => handleOpenCategoryForm(record)}
                            title="Chỉnh sửa"
                        />
                        <Popconfirm
                            title="Xóa danh mục"
                            description="Bạn có chắc chắn muốn xóa?"
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDeleteCategory(record)}
                        >
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<Trash2 size={16} />}
                                title="Xóa"
                            />
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [editingCategory, isUpdatingCategory],
    )

    const isSubmitting = isCreating || isUpdating || isUploading

    const categoryOptions = useMemo<
        Array<{ label: string; value: string; color?: string }>
    >(
        () =>
            categories.map((cat: IDocumentCategory) => ({
                label: cat.name,
                value: cat.slug,
                color: cat.color,
            })),
        [categories],
    )

    const categoryMap = useMemo<Map<string, IDocumentCategory>>(
        () =>
            new Map(
                categories.map((cat: IDocumentCategory) => [
                    cat.slug,
                    cat,
                ]),
            ),
        [categories],
    )

    const debounceSearch = useDebounce(
        (value: string) => setFilter((prev) => ({ ...prev, search: value })),
        400,
    )

    const handleSearch = (value: string) => {
        setSearchText(value)
        debounceSearch(value)
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

    useEffect(() => {
        setBreadcrumb([{ title: 'Quản lý tài liệu thiết bị' }])
    }, [setBreadcrumb])

    useEffect(() => {
        if (!filter.type && categories.length > 0) {
            setFilter((prev) => ({
                ...prev,
                type: categories[0].slug,
            }))
        }
    }, [categories, filter.type, setFilter])

    return (
        <Card
            variant="borderless"
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
        >
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <Space className="space-x-2">
                        <div className="grid grid-cols-4 gap-4">
                            <SearchBar
                                placeholder="Tìm theo tên mục"
                                value={searchText}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            <Select
                                showSearch={{
                                    optionFilterProp: 'label',
                                    filterOption: (input, option) =>
                                        ((option?.label as string) ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase()),
                                }}
                                allowClear
                                placeholder="Lọc theo danh mục thiết bị"
                                value={filter.type || undefined}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        type: e,
                                    }))
                                }
                                options={categoryOptions}
                                suffixIcon={<Filter size={16} />}
                            />

                            <Select
                                showSearch={{
                                    optionFilterProp: 'label',
                                    filterOption: (input, option) =>
                                        ((option?.label as string) ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase()),
                                }}
                                allowClear
                                placeholder="Lọc theo loại nội dung"
                                value={filter.contentType || undefined}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        contentType: e,
                                    }))
                                }
                                options={CONTENT_TYPES}
                                suffixIcon={<Filter size={16} />}
                            />
                        </div>
                    </Space>

                    <Space size={12}>
                        <Button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="rounded-lg h-10"
                        >
                            Quản lý danh mục
                        </Button>
                        <Button
                            onClick={() => handleOpenModal()}
                            type="primary"
                            icon={<Plus size={16} />}
                            className="rounded-lg h-10 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center"
                        >
                            Thêm mục
                        </Button>
                    </Space>
                </div>
            </div>

            <Table
                columns={columns as any}
                dataSource={data?.documents || []}
                rowKey="_id"
                pagination={{
                    pageSize: PAGE_LIMIT,
                    showTotal: (total) => `Tổng: ${total} mục`,
                }}
                loading={{
                    indicator: <LoadingOutlined />,
                    spinning: isDeleting || isLoading,
                }}
                className="custom-table rounded-lg"
                scroll={{ y: 'calc(100vh - 320px)' }}
            />

            {/* Modal */}
            <Modal
                title={
                    <div className="mb-6 text-lg">
                        {editingDocument
                            ? 'Chỉnh sửa mục'
                            : 'Thêm mục mới'}
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={1500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        type: categoryOptions?.[0]?.value ?? '',
                        contentType: CONTENT_TYPES[0].value,
                    }}
                    className="!flex-1"
                >
                    <Row gutter={32}>
                        <Col span={8}>
                            <div className="mb-8">
                                <h3 className="text-md font-semibold text-gray-900 mb-4">
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
                                        rootClassName="!w-25"
                                        itemRender={() => null}
                                    >
                                        {imageFilePreview ||
                                            editingDocument?.thumbnail ? (
                                            <DefaultImage
                                                src={
                                                    imageFilePreview ||
                                                    (editingDocument?.thumbnail as string)
                                                }
                                                className="w-full h-45"
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
                        </Col>
                        <Col span={16}>
                            <Form.Item
                                name="title"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập tiêu đề',
                                    },
                                ]}
                            >
                                <FloatingInput
                                    label="Tên mục"
                                    placeholder="Nhập tên mục"
                                />
                            </Form.Item>

                            <Form.Item name="description">
                                <FloatingTextArea
                                    label="Mô tả ngắn"
                                    rows={3}
                                    placeholder="Mô tả ngắn về mục"
                                />
                            </Form.Item>

                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item
                                    name="type"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Chọn danh mục thiết bị',
                                        },
                                    ]}
                                >
                                    <FloatingSelect
                                        label="Danh mục thiết bị"
                                        options={categoryOptions}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="contentType"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Chọn loại nội dung',
                                        },
                                    ]}
                                >
                                    <FloatingSelect
                                        label="Loại nội dung"
                                        placeholder="Chọn loại nội dung"
                                        options={CONTENT_TYPES}
                                        onChange={setContentType}
                                    />
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>

                    {contentType === 'text' ? (
                        <>
                            <div className="font-semibold">
                                Nội dung <span className="text-red-400">*</span>
                            </div>
                            <SimpleEditor
                                value={generateJSON(content ?? '', [
                                    StarterKit,
                                    Image,
                                ])}
                                placeholder="Nhập nội dung mục"
                                setUploading={setLoadingUploadImage}
                                onChange={(value: any) => setContent(value)}
                            />
                        </>
                    ) : (
                        <Form.Item label="Tải file">
                            <Upload
                                maxCount={1}
                                accept=".pdf,.doc,.docx,.txt,.md"
                                beforeUpload={(file) => {
                                    setSelectedFile(file)
                                    return false
                                }}
                            >
                                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 cursor-pointer w-full">
                                    <FileText
                                        size={32}
                                        className="mx-auto text-gray-400 mb-2"
                                    />
                                    <p className="text-gray-600">
                                        Kéo file vào đây hoặc click để chọn
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PDF, Word, Text (Max 50MB)
                                    </p>
                                    {selectedFile && (
                                        <p className="text-green-600 font-semibold mt-2">
                                            ✓ {selectedFile.name}
                                        </p>
                                    )}
                                </div>
                            </Upload>
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Space className="justify-end w-full mt-6">
                            <Button onClick={handleCloseModal}>Hủy</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={
                                    isSubmitting ||
                                    loadingUploadImage ||
                                    isUploadingImage
                                }
                            >
                                {editingDocument ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={isCategoryModalOpen}
                onCancel={() => setIsCategoryModalOpen(false)}
                footer={null}
                title="Danh mục thiết bị"
                width={700}
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="font-semibold">Danh sách danh mục</div>
                    <Button
                        type="primary"
                        icon={<Plus size={16} />}
                        onClick={() => handleOpenCategoryForm()}
                    >
                        Thêm danh mục
                    </Button>
                </div>
                <Table
                    rowKey="_id"
                    columns={categoryColumns as any}
                    dataSource={categories}
                    pagination={false}
                    loading={{
                        indicator: <LoadingOutlined />,
                        spinning:
                            isCreatingCategory ||
                            isUpdatingCategory ||
                            isDeletingCategory,
                    }}
                    className="custom-table rounded-lg"
                />
            </Modal>

            <Modal
                open={isCategoryFormOpen}
                onCancel={() => setIsCategoryFormOpen(false)}
                footer={null}
                title={
                    editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'
                }
                width={560}
            >
                <Form
                    form={categoryForm}
                    layout="vertical"
                    onFinish={handleSubmitCategory}
                    initialValues={{
                        color: 'blue',
                        isPublished: true,
                    }}
                >
                    <Form.Item
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên danh mục',
                            },
                        ]}
                    >
                        <FloatingInput
                            label="Tên danh mục"
                            placeholder="Nhập tên danh mục thiết bị"
                        />
                    </Form.Item>

                    <Form.Item name="description">
                        <FloatingTextArea
                            label="Mô tả"
                            rows={3}
                            placeholder="Mô tả ngắn về danh mục"
                        />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="color">
                            <FloatingSelect
                                label="Màu hiển thị"
                                options={[
                                    { label: 'Blue', value: 'blue' },
                                    { label: 'Gold', value: 'gold' },
                                    { label: 'Green', value: 'green' },
                                    { label: 'Red', value: 'red' },
                                    { label: 'Cyan', value: 'cyan' },
                                    { label: 'Geekblue', value: 'geekblue' },
                                    { label: 'Purple', value: 'purple' },
                                    { label: 'Magenta', value: 'magenta' },
                                    { label: 'Volcano', value: 'volcano' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="isPublished"
                            label="Xuất bản"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </div>

                    <Form.Item>
                        <Space className="justify-end w-full mt-6">
                            <Button onClick={() => setIsCategoryFormOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isCreatingCategory || isUpdatingCategory}
                            >
                                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    )
}

export default Documents
