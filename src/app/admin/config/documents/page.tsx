'use client'

import { FloatingInput, FloatingSelect, FloatingTextArea } from '@/components/inputs/FloatingInputs';
import SearchBar from '@/components/SearchBar';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { ALLOWED_FILE_TYPES, CONTENT_TYPES, DOCUMENT_TYPES, MAX_FILE_SIZE, PAGE_LIMIT } from '@/constants/common';
import { useDocuments } from '@/hooks/admin/use-documents';
import useDebounce from '@/hooks/use-debounce';
import { showMessage } from '@/hooks/use-message';
import { breadcrumbAtom, filterDocumentAtom } from '@/stores';
import { IDocument } from '@/types/document';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Card, Form, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Upload } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { Download, Edit2, FileText, Filter, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Documents = () => {
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<IDocument | null>(null);
    const [contentType, setContentType] = useState<'text' | 'file'>('text');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [filter, setFilter] = useAtom(filterDocumentAtom);
    const setBreadcrumb = useSetAtom(breadcrumbAtom);

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
    } = useDocuments({ ...filter });

    const handleOpenModal = (doc?: IDocument) => {
        if (doc) {
            setEditingDocument(doc);
            setContentType(doc.contentType);
            form.setFieldsValue({
                title: doc.title,
                description: doc.description,
                type: doc.type,
                contentType: doc.contentType,
                content: doc.content,
            });
        } else {
            setEditingDocument(null);
            setContentType('text');
            form.resetFields();
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
        setContentType('text');
        setSelectedFile(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            let documentData: Omit<IDocument, '_id'> = {
                title: values.title,
                description: values.description,
                type: values.type,
                contentType,
                isPublished: true,
            };

            if (contentType === 'text') {
                // Text content
                documentData.content = values.content;
            } else {
                // File upload
                if (!selectedFile && !editingDocument) {
                    showMessage.error('Vui lòng chọn file');
                    return;
                }

                if (selectedFile) {
                    // Validate file
                    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
                        showMessage.error('Loại file không hỗ trợ. Chỉ PDF, Word, Text được chấp nhận');
                        return;
                    }

                    if (selectedFile.size > MAX_FILE_SIZE) {
                        showMessage.error(`File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`);
                        return;
                    }

                    // Upload file
                    const uploadResult = await uploadFileAsync({
                        file: selectedFile,
                        folder: 'lightingpower',
                    });

                    documentData.fileUrl = uploadResult.secure_url;
                    documentData.fileName = selectedFile.name;
                    documentData.fileSize = selectedFile.size;
                    documentData.mimeType = selectedFile.type;
                }
            }

            if (editingDocument) {
                await updateDocumentAsync({
                    id: editingDocument._id!,
                    data: documentData,
                });
                showMessage.success('Cập nhật tài liệu thành công');
            } else {
                await createDocumentAsync(documentData);
                showMessage.success('Tạo tài liệu thành công');
            }

            handleCloseModal();
        } catch (error: any) {
            showMessage.error(error.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (record: IDocument) => {
        if (record._id) {
            try {
                await deleteDocumentAsync(record._id);
                showMessage.success('Xóa tài liệu thành công');
            } catch (error: any) {
                showMessage.error(error.message || 'Lỗi xóa tài liệu');
            }
        }
    };

    const handleUpdateStatus = async (status: boolean, record: IDocument) => {
        if (record._id) {
            setEditingDocument(record);
            try {
                await updateDocumentAsync({
                    id: String(record._id),
                    data: { ...record, isPublished: status }
                });
                showMessage.success('Cập nhật thành công');
            } catch (error: any) {
                showMessage.error(error.message || 'Đã có lỗi xảy ra');
            } finally {
                setEditingDocument(null);
            }
        }
    }

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: 250,
            render: (text: string) => <span className="font-semibold">{text}</span>,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 150,
            align: 'center',
            render: (type: string) => {
                const typeConfig = DOCUMENT_TYPES.find(t => t.value === type);
                return <Tag color={typeConfig?.color} variant='outlined'>{typeConfig?.label}</Tag>;
            },
        },
        {
            title: 'Nội dung',
            dataIndex: 'contentType',
            key: 'contentType',
            width: 100,
            align: 'center',
            render: (contentType: string) => (
                <Tag color={contentType === 'text' ? 'blue' : 'green'} variant='outlined'>
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
                                const a = document.createElement('a');
                                a.href = record.fileUrl!;
                                a.download = record.fileName || 'document';
                                a.click();
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
                        title="Xóa tài liệu"
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
    ];

    const isSubmitting = isCreating || isUpdating || isUploading;

    const debounceSearch = useDebounce((value: string) => setFilter(prev => ({ ...prev, search: value })), 400);

    const handleSearch = (value: string) => {
        setSearchText(value);
        debounceSearch(value);
    }
    useEffect(() => {
        setBreadcrumb([{ title: 'Quản lý tài liệu' }])
    }, [setBreadcrumb]);

    return (
        <Card
            variant='borderless'
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
        >
            <div className="mb-6">
                <div className='flex justify-between items-center'>
                    <Space className='space-x-2'>
                        <div className="grid grid-cols-4 gap-4">
                            <SearchBar
                                placeholder='Tìm kiếm theo tên tài liệu'
                                value={searchText}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            <Select
                                showSearch={{
                                    optionFilterProp: 'label',
                                    filterOption: (input, option) =>
                                        (option?.label as string ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                }}
                                allowClear
                                placeholder='Lọc theo loại tài liệu'
                                value={filter.type || undefined}
                                onChange={e => setFilter(prev => ({
                                    ...prev,
                                    type: e
                                }))}
                                options={DOCUMENT_TYPES}
                                suffixIcon={<Filter size={16} />}
                            />

                            <Select
                                showSearch={{
                                    optionFilterProp: 'label',
                                    filterOption: (input, option) =>
                                        (option?.label as string ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                }}
                                allowClear
                                placeholder='Lọc theo loại nội dung'
                                value={filter.contentType || undefined}
                                onChange={e => setFilter(prev => ({
                                    ...prev,
                                    contentType: e
                                }))}
                                options={CONTENT_TYPES}
                                suffixIcon={<Filter size={16} />}
                            />
                        </div>
                    </Space>

                    <Space size={12}>
                        <Button
                            onClick={() => handleOpenModal()}
                            type="primary"
                            icon={<Plus size={16} />}
                            className="rounded-lg h-10 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center"
                        >
                            Thêm tài liệu
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
                    showTotal: (total) => `Tổng: ${total} tài liệu`,
                }}
                loading={{
                    indicator: <LoadingOutlined />,
                    spinning: isDeleting || isLoading
                }}
                className="custom-table rounded-lg"
                scroll={{ y: 'calc(100vh - 320px)' }}
            />

            {/* Modal */}
            <Modal
                title={<div className='mb-6 text-lg'>{editingDocument ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}</div>}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        type: DOCUMENT_TYPES[0].value,
                        contentType: CONTENT_TYPES[0].value,
                    }}
                >
                    <Form.Item
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <FloatingInput label='Tiêu đề' placeholder="Nhập tiêu đề tài liệu" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                    >
                        <FloatingTextArea label='Mô tả ngắn' rows={3} placeholder="Mô tả ngắn về tài liệu" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="type"
                            rules={[{ required: true, message: 'Chọn loại tài liệu' }]}
                        >
                            <FloatingSelect
                                label="Chọn loại"
                                options={DOCUMENT_TYPES}
                            />
                        </Form.Item>

                        <Form.Item
                            name="contentType"
                            rules={[{ required: true, message: 'Chọn loại nội dung' }]}
                        >
                            <FloatingSelect
                                label='Loại nội dung'
                                placeholder="Chọn loại nội dung"
                                options={CONTENT_TYPES}
                                onChange={setContentType}
                            />
                        </Form.Item>
                    </div>

                    {contentType === 'text' ? (
                        <Form.Item
                            label="Nội dung"
                            name="content"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                        >
                            <SimpleEditor placeholder="Nhập nội dung tài liệu" />
                        </Form.Item>
                    ) : (
                        <Form.Item label="Tải file">
                            <Upload
                                maxCount={1}
                                accept=".pdf,.doc,.docx,.txt,.md"
                                beforeUpload={(file) => {
                                    setSelectedFile(file);
                                    return false;
                                }}
                            >
                                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 cursor-pointer w-full">
                                    <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-600">Kéo file vào đây hoặc click để chọn</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, Word, Text (Max 50MB)</p>
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
                        <Space className='justify-end w-full'>
                            <Button onClick={handleCloseModal}>Hủy</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmitting}
                            >
                                {editingDocument ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default Documents;
