'use client'

import SearchBar from '@/components/SearchBar';
import TableRowAction from '@/components/TableRowActions';
import { PAGE_LIMIT } from '@/constants/common';
import { routes } from '@/constants/routes';
import { useCategories } from '@/hooks/admin/use-categories';
import { useProducts } from '@/hooks/admin/use-products';
import useDebounce from '@/hooks/use-debounce';
import { showMessage } from '@/hooks/use-message';
import { convertNestedCategories } from '@/lib/utils';
import { breadcrumbAtom } from '@/stores';
import { filterProductAtom as productFilterAtom, selectedProductAtom } from '@/stores/product';
import { ICategory } from '@/types/category';
import { EProductStatus, IProduct } from '@/types/product';
import { LoadingOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Image, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { Filter, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const statusConfig = {
    active: { color: 'green', text: 'Đang bán' },
    draft: { color: 'default', text: 'Nháp' },
    out_of_stock: { color: 'red', text: 'Hết hàng' },
    discontinued: { color: 'volcano', text: 'Ngừng sản xuất' },
};

const tagConfig = {
    new: { color: 'blue', text: 'Mới' },
    best_seller: { color: 'orange', text: 'Bán chạy' },
};

const Product = () => {
    const [searchText, setSearchText] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
    const [filter, setFilter] = useAtom(productFilterAtom);
    const setBreadcrumb = useSetAtom(breadcrumbAtom);
    const router = useRouter();

    const {
        products: data,
        isLoading,
        updateProduct,
        isUpdating,
        deleteProductAsync,
        isDeleting,
        bulkDeleteProductsAsync,
    } = useProducts({ ...filter });

    const { categories: categoriesData } = useCategories({ view: 'list' });

    const handleUpdateStatus = useCallback((status: string, record: IProduct) => {
        if (record._id) {
            setSelectedProduct(record);
            updateProduct({
                id: String(record._id),
                data: { ...record, status: status as EProductStatus }
            });
        }
    }, [setSelectedProduct, updateProduct]);

    const handleUpdateFeatured = useCallback((isFeatured: boolean, record: IProduct) => {
        if (record._id) {
            setSelectedProduct(record);
            updateProduct({
                id: String(record._id),
                data: { ...record, isFeatured }
            });
        }
    }, [setSelectedProduct, updateProduct]);

    const handleDelete = useCallback(async (productId: string) => {
        await deleteProductAsync(productId);
        showMessage.success('Xóa sản phẩm thành công');
    }, [deleteProductAsync]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedProducts.length === 0) {
            showMessage.warning('Vui lòng chọn sản phẩm để xóa');
            return;
        }
        await bulkDeleteProductsAsync(selectedProducts);
        showMessage.success('Xóa thành công');
        setSelectedProducts([]);
    }, [selectedProducts]);

    const columns = useMemo(() => [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            width: 300,
            render: (text: string, record: IProduct) => (
                <Space size={12} align='center'>
                    {record.images && record.images?.length > 0 && (
                        <Image
                            preview={false}
                            style={{ borderRadius: 8, border: '#cac8c8 1px solid', marginTop: 2 }}
                            src={record.images[0]}
                            width={80}
                            height={50}
                        />
                    )}
                    <div>
                        <div className="font-semibold text-gray-900">{text}</div>
                        <div className="text-sm text-gray-500">{record.sku}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category: ICategory) => (
                <span className="text-gray-700">{category.name}</span>
            ),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            width: 120,
            align: 'right',
            render: (price: number) => (
                <span className="font-semibold text-gray-900">
                    {price.toLocaleString('vi-VN')}đ
                </span>
            ),
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stock',
            key: 'stock',
            width: 100,
            align: 'center',
            render: (stock: number, record: IProduct) => {
                const isLowStock = stock <= (record.lowStockThreshold || 10);
                return (
                    <Badge
                        count={stock}
                        style={{
                            backgroundColor: isLowStock ? '#ff4d4f' : '#52c41a',
                            fontSize: '12px',
                        }}
                        showZero
                    />
                );
            },
        },
        {
            title: 'Bán được',
            dataIndex: 'soldCount',
            key: 'soldCount',
            width: 100,
            align: 'center',
            render: (count: number) => (
                <span className="font-semibold">{count}</span>
            ),
        },
        {
            title: 'Tag',
            dataIndex: 'tags',
            key: 'tags',
            width: 80,
            align: 'center',
            render: (tags: string[]) => (
                <Space size={4} wrap>
                    {tags?.length > 0 ? tags.map(tag => (
                        <Tag
                            key={tag}
                            color={tagConfig[tag as keyof typeof tagConfig]?.color}
                        >
                            {tagConfig[tag as keyof typeof tagConfig]?.text || tag}
                        </Tag>
                    )) : '-'}
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            align: 'center',
            render: (status: string, record: IProduct) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                return (
                    <Select
                        value={status}
                        onChange={(value) => handleUpdateStatus(value, record)}
                        disabled={isUpdating && selectedProduct?._id === record._id}
                        loading={isUpdating && selectedProduct?._id === record._id}
                        className="w-full"
                        options={Object.entries(statusConfig).map(([key, val]) => ({
                            value: key,
                            label: val.text
                        }))}
                    />
                );
            },
        },
        {
            title: 'Nổi bật',
            dataIndex: 'isFeatured',
            key: 'isFeatured',
            width: 80,
            align: 'center',
            render: (isFeatured: boolean, record: IProduct) => (
                <Switch
                    checked={isFeatured}
                    onChange={(value) => handleUpdateFeatured(value, record)}
                    disabled={isUpdating && selectedProduct?._id === record._id}
                    loading={isUpdating && selectedProduct?._id === record._id}
                />
            ),
        },
        {
            title: '',
            key: 'action',
            width: 80,
            align: 'center',
            render: (_: any, record: IProduct) => (
                <TableRowAction
                    record={record}
                    enableEdit
                    enableDelete
                    onClickEdit={() => {
                        router.push(`${routes.product.url}/form?id=${record._id}`);
                    }}
                    onClickDelete={() => handleDelete(record._id)}
                />
            ),
        },
    ], [handleUpdateStatus, handleUpdateFeatured, isUpdating, searchText, selectedProduct]);

    const debounceSearch = useDebounce((value: string) => setFilter(prev => ({ ...prev, search: value })), 400);

    const handleSearch = (value: string) => {
        setSearchText(value);
        debounceSearch(value);
    }

    useEffect(() => {
        setBreadcrumb([{ title: 'Quản lý sản phẩm', href: routes.product.url }]);
    }, [setBreadcrumb]);

    return (
        <Card
            variant='borderless'
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
        >
            {/* Header */}
            <div className="mb-6">
                <div className='flex justify-between items-center'>
                    <Space className='space-x-2'>
                        <div className="grid grid-cols-4 gap-4">
                            <SearchBar
                                placeholder='Tìm kiếm theo tên, SKU'
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
                                placeholder='Lọc theo danh mục'
                                value={filter.categoryId || undefined}
                                onChange={e => setFilter(prev => ({
                                    ...prev,
                                    categoryId: e
                                }))}
                                options={convertNestedCategories(categoriesData?.data || [])}
                                suffixIcon={<Filter size={16} />}
                            />

                            <Select
                                allowClear
                                placeholder='Lọc theo trạng thái'
                                value={filter.status || undefined}
                                onChange={e => setFilter(prev => ({
                                    ...prev,
                                    status: e
                                }))}
                                options={Object.entries(statusConfig).map(([key, val]) => ({
                                    value: key,
                                    label: val.text
                                }))}
                                suffixIcon={<Filter size={16} />}
                            />

                            <Select
                                allowClear
                                placeholder='Lọc theo tag'
                                value={filter.tags?.[0] || undefined}
                                onChange={e => setFilter(prev => ({
                                    ...prev,
                                    tags: e ? [e] : undefined
                                }))}
                                options={Object.entries(tagConfig).map(([key, val]) => ({
                                    value: key,
                                    label: val.text
                                }))}
                                suffixIcon={<Filter size={16} />}
                            />
                        </div>
                    </Space>

                    <Space size={12}>
                        {selectedProducts.length > 0 && (
                            <Popconfirm
                                title="Xác nhận xóa"
                                description="Bạn có chắc chắn muốn xóa?"
                                okText="Xóa"
                                cancelText="Hủy"
                                onConfirm={handleBulkDelete}
                            >
                                <Button
                                    danger
                                    icon={<Trash2 size={16} />}
                                    className="rounded-lg h-10"
                                >
                                    Xóa ({selectedProducts.length})
                                </Button>
                            </Popconfirm>
                        )}
                        <Button
                            onClick={() => router.push(`${routes.product.url}/form`)}
                            type="primary"
                            icon={<Plus size={16} />}
                            className="rounded-lg h-10 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center"
                        >
                            Thêm mới
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Table */}
            <Table
                rowKey={'_id'}
                loading={{
                    indicator: <LoadingOutlined />,
                    spinning: isLoading || isDeleting
                }}
                columns={columns as any}
                dataSource={data?.data?.products || []}
                pagination={{
                    pageSize: PAGE_LIMIT,
                    showTotal: (total) => `Tổng: ${total} sản phẩm`,
                    className: '!mt-6 !px-6',
                    onChange: (page) => setFilter(prev => ({ ...prev, page }))
                }}
                className="custom-table rounded-lg"
                scroll={{ x: 1400, y: 'calc(100vh - 320px)' }}
                rowSelection={{
                    selectedRowKeys: selectedProducts,
                    onChange: (selectedRowKeys) => setSelectedProducts(selectedRowKeys as string[]),
                }}
            />
        </Card>
    );
};

export default Product;
