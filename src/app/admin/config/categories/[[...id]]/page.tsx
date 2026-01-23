'use client'

import SearchBar from '@/components/SearchBar';
import TableRowAction from '@/components/TableRowActions';
import { PAGE_LIMIT } from '@/constants/common';
import { routes } from '@/constants/routes';
import { useCategories } from '@/hooks/admin/use-categories';
import useDebounce from '@/hooks/use-debounce';
import { showMessage } from '@/hooks/use-message';
import { filterAtom, selectedCategoryAtom } from '@/stores/category';
import { breadcrumbAtom } from '@/stores/ui';
import { ICategory } from '@/types/category';
import { LoadingOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Flex, Select, Space, Switch, Table } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronLeft, Filter, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Option } = Select;

const statusConfig = {
    active: {
        containerClass: 'bg-green-50 text-green-700',
        text: 'Hiện'
    },
    inactive: {
        containerClass: 'bg-gray-100 text-gray-700',
        text: 'Ẩn'
    },
};
const childrenBadgeColors = ['#cacaca', 'cyan', 'geekblue'];

const Category = () => {
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
    const [filter, setFilter] = useAtom(filterAtom);
    const setBreadcrumb = useSetAtom(breadcrumbAtom);
    const router = useRouter();
    const params = useParams();

    // Lấy parentId từ URL params
    const currentParentId = Array.isArray(params.id) ? params.id[params.id.length - 1] : params.id;

    const cleanedFilter = Object.fromEntries(
        Object.entries(filter as any).filter(
            ([_, value]) => value !== undefined && value !== null && value !== ''
        )
    );

    // Thêm parentId vào filter khi có trong URL
    const apiFilter = {
        view: 'list',
        ...cleanedFilter,
        ...(currentParentId && { parentId: currentParentId })
    };

    const {
        categories: data,
        isLoading,
        updateCategory,
        isUpdating,
        deleteCategoryAsync,
        isDeleting,
        deleteError,
    } = useCategories(apiFilter);

    const handleUpdateStatus = (status: boolean, record: ICategory) => {
        if (record._id) {
            setSelectedCategory(record);
            updateCategory({
                id: String(record._id),
                data: { ...record, isActive: status }
            }, {
                onSuccess() {
                    showMessage.success('Cập nhật thành công');
                },
                onError() {
                    showMessage.error('Đã có lỗi xảy ra');
                }
            })
        }
    }

    const handleDelete = async (record: ICategory) => {
        if (record._id) {
            await deleteCategoryAsync(record._id);
            if (!deleteError) {
                showMessage.success('Xóa thành công');
            } else {
                showMessage.error('Đã có lỗi xảy ra');
            }
        }
    }

    const columns = useMemo(() => [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            width: 280,
            render: (text: string, record: ICategory) => (
                <Space size={12}>
                    {record?.childrenCount && record.childrenCount > 0 ? (
                        <div
                            onClick={() => handleGoToChildTable(record._id)}
                            className="font-semibold text-gray-900 mb-0.5 cursor-pointer hover:opacity-70"
                        >
                            {text}
                        </div>
                    ) : (
                        <div className="font-semibold text-gray-700 mb-0.5">{text}</div>
                    )}
                </Space>
            ),
        },
        {
            title: 'Số cấp con',
            dataIndex: 'children',
            key: 'children',
            width: 280,
            align: 'center' as const,
            render: (text: string, record: ICategory) => (
                <Space size={12}>
                    <Badge
                        showZero
                        count={record?.childrenCount || 0}
                        color={childrenBadgeColors[Math.min(record?.childrenCount || 0, 2)]}
                    />
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            align: 'center' as const,
            width: 120,
            render: (text: boolean, record: ICategory) => {
                const config = statusConfig[text ? 'active' : 'inactive'];
                return (
                    <Switch
                        loading={isUpdating && selectedCategory?._id === record._id}
                        checkedChildren={config.text}
                        unCheckedChildren={config.text}
                        checked={text}
                        onChange={(e) => handleUpdateStatus(e, record)}
                        rootClassName={config.containerClass}
                    />
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: ICategory) => (
                <TableRowAction
                    record={record}
                    enableEdit
                    enableDelete
                    onClickEdit={() => router.push(`${routes.category.url}/form?id=${record._id}`)}
                    onClickDelete={() => handleDelete(record)}
                />
            ),
        },
    ], [handleUpdateStatus, isUpdating, selectedCategory]);

    // Filter data dựa trên parentId
    const filteredData = useMemo(() => {
        if (!data?.data) return [];

        const allCategories = data.data as ICategory[];

        // Nếu có parentId trong URL, hiển thị children của parent đó
        if (currentParentId) {
            return allCategories.filter((c: ICategory) => c.parentId === currentParentId);
        }

        // Nếu không có parentId, chỉ hiển thị root categories (không có parentId)
        return allCategories.filter((c: ICategory) => !c.parentId);
    }, [data, currentParentId]);


    const handleGoToChildTable = useCallback((parentId: string) => {
        // Reset search và isActive filter khi chuyển sang xem children
        setFilter(prev => ({
            ...prev,
            isActive: undefined,
            search: ''
        }));

        // Thêm parentId vào URL
        router.push(`${routes.category.url}/${parentId}`);
        setSearchText(''); // Reset search text
    }, [router, setFilter]);

    const debounceSearch = useDebounce((value: string) => setFilter(prev => ({ isActive: prev?.isActive, search: value })), 400);

    const handleSearch = useCallback((value: string) => {
        setSearchText(value);
        debounceSearch(value);
    }, [setSearchText, debounceSearch])

    const handleBack = useCallback(() => {
        // Xóa parentId khỏi filter
        setFilter(prev => ({
            ...prev,
            isActive: undefined,
            search: ''
        }));
        setSearchText('');
        router.back();
    }, [router, setFilter]);

    useEffect(() => {
        setBreadcrumb([{
            key: routes.category.url,
            title: routes.category.title,
        }]);
    }, [setBreadcrumb]);

    return (
        <Card
            variant='borderless'
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
        >
            {/* Header */}
            <div className="mb-6">
                {/* Filters */}
                <div className='flex justify-between items-center'>
                    <div className="grid grid-cols-3 gap-6">
                        <Flex align='center' gap={20} className='col-span-2'>
                            {currentParentId && (
                                <ChevronLeft
                                    className='cursor-pointer hover:text-blue-600'
                                    onClick={handleBack}
                                />
                            )}
                            <SearchBar
                                value={searchText}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder='Tìm theo tên danh mục'
                            />
                        </Flex>
                        <div className='flex items-center gap-6'>
                            <Select
                                value={filter?.isActive !== undefined ? (filter.isActive ? 'active' : 'inactive') : 'all'}
                                onChange={e => setFilter({
                                    ...filter,
                                    isActive: e !== 'all' ? (e === 'active' ? true : false) : undefined
                                } as any)}
                                className="w-45"
                                suffixIcon={<Filter size={16} />}
                            >
                                <Option value="all">Tất cả trạng thái</Option>
                                <Option value="active">Hiện</Option>
                                <Option value="inactive">Ẩn</Option>
                            </Select>
                        </div>
                    </div>
                    <Space size={12}>
                        <Button
                            type="primary"
                            icon={<Plus size={16} />}
                            className="rounded-lg h-10 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center"
                            onClick={() => router.push(`${routes.category.url}/form`)}
                        >
                            Thêm mới
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Table */}
            <Table
                rowKey={'_id'}
                columns={columns as any}
                loading={{
                    indicator: <LoadingOutlined />,
                    spinning: isLoading
                }}
                dataSource={filteredData}
                pagination={{
                    pageSize: PAGE_LIMIT,
                    showTotal: (total) => `Tổng: ${total} danh mục`,
                    className: '!mt-6 !px-6'
                }}
                className="custom-table rounded-lg"
                scroll={{ y: 'calc(100vh - 320px)' }}
            />
        </Card>
    );
};

export default Category;