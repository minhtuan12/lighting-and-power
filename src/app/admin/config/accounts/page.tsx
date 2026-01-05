'use client'

import SearchBar from '@/components/SearchBar';
import { PAGE_LIMIT } from '@/constants/common';
import { routes } from '@/constants/routes';
import { useAccounts } from '@/hooks/admin/use-accounts';
import useDebounce from '@/hooks/use-debounce';
import { breadcrumbAtom } from '@/stores/ui';
import { LoadingOutlined } from '@ant-design/icons';
import { Card, Space, Table } from 'antd';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

const Account = () => {
    const [searchText, setSearchText] = useState('');
    const [debounceSearchText, setDebounceSearchText] = useState('');
    const setBreadcrumb = useSetAtom(breadcrumbAtom);
    const { data, error, isLoading } = useAccounts({ search: debounceSearchText });

    const columns = useMemo(() => [
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            width: 280,
            render: (text: string) => (
                <Space size={12}>
                    <div className="font-semibold text-gray-900 mb-0.5">
                        {text}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 150,
            render: (text: string) => (
                <div className="font-normal text-gray-900 mb-0.5">
                    {text || '-'}
                </div>
            ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            align: 'center',
            render: (text: string) => (
                <div className="font-normal text-gray-900 mb-0.5 text-center">
                    {text || '-'}
                </div>
            ),
        },
    ], []);

    const debounceSearch = useDebounce((value: string) => {
        setDebounceSearchText(value);
    }, 300)

    const handleSearch = useCallback((value: string) => {
        setSearchText(value);
        debounceSearch(value);
    }, [setSearchText, debounceSearch])

    useEffect(() => {
        setBreadcrumb([{
            key: routes.account.url,
            title: routes.account.title,
        }])
    }, [setBreadcrumb])

    return (
        <div className="p-6 bg-gray-50">
            <Card
                variant='borderless'
                className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
            >
                {/* Header */}
                <div className="mb-6">
                    {/* Filters */}
                    <div className='flex justify-between items-center w-full'>
                        <SearchBar className='!w-1/3' value={searchText} onChange={e => handleSearch(e.target.value)} placeholder='Tìm theo tên, email hoặc số điện thoại' />
                    </div>
                </div>

                {/* Table */}
                <Table
                    rowKey={'_id'}
                    loading={{
                        indicator: <LoadingOutlined />,
                        spinning: isLoading
                    }}
                    columns={columns as any}
                    dataSource={data?.accounts || []}
                    pagination={{
                        pageSize: PAGE_LIMIT,
                        showTotal: (total) => `Tổng: ${total} tài khoản`,
                        className: '!mt-6 !px-6'
                    }}
                    className="custom-table rounded-lg"
                    scroll={{ y: 'calc(100vh - 330px)' }}
                />
            </Card>
        </div>
    );
};

export default Account;
