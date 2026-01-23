'use client'

import { FloatingCascader, FloatingInput, FloatingTextArea } from '@/components/inputs/FloatingInputs';
import { routes } from '@/constants/routes';
import { useCategories } from '@/hooks/admin/use-categories';
import { showMessage } from '@/hooks/use-message';
import { buildTree, convertNestedCategories } from '@/lib/utils';
import { breadcrumbAtom } from '@/stores/ui';
import { ICategory } from '@/types/category';
import { Button, Card, Form, Select, Switch } from 'antd';
import { useSetAtom } from 'jotai';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Option } = Select;

const CategoryForm = () => {
    const router = useRouter();
    const setBreadcrumb = useSetAtom(breadcrumbAtom);
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('id');
    const isEdit = !!categoryId;

    const [form] = Form.useForm();
    const [parentCategories, setParentCategories] = useState<ICategory[]>([]);

    const {
        categories: allCategories,
        isLoading: isLoadingCategories,
        createCategoryAsync,
        updateCategoryAsync,
        isCreating,
        isUpdating,
    } = useCategories({ view: 'list' });

    const { getCategoryById } = useCategories();
    const { data: categoryData, isLoading: isLoadingCategory } = categoryId
        ? getCategoryById(categoryId)
        : { data: null, isLoading: false };

    // Load parent categories (chỉ lấy level 0 và 1)
    useEffect(() => {
        if (allCategories?.data) {
            const parents = allCategories.data.filter((cat: ICategory) =>
                cat.level <= 1 && (!isEdit || cat._id !== categoryId)
            );
            setParentCategories(parents);
        }
    }, [allCategories, categoryId, isEdit]);

    // Tìm category theo ID
    const findCategoryById = (id: string): ICategory | undefined => {
        return allCategories?.data?.find((cat: ICategory) => cat._id === id);
    };

    // Handle parent category change
    const handleParentChange = (value: (string | number | null)[], selectOptions: any[]) => {
        const parentId = value && value.length > 0 ? value[value.length - 1] : undefined;
        if (parentId) {
            const selectedParent = findCategoryById(parentId as string);

            // Nếu parent category có isActive = false, tự động set form isActive = false
            if (selectedParent && !selectedParent.isActive) {
                form.setFieldValue('isActive', false);
            }
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData: Partial<ICategory> = {
                name: values.name,
                description: values.description,
                parentId: values.parentId?.[values.parentId?.length - 1] || null,
                isActive: values.isActive ?? true,
                metaTitle: values.metaTitle,
                metaDescription: values.metaDescription,
                metaKeywords: values.metaKeywords,
            };

            if (isEdit && categoryId) {
                await updateCategoryAsync({
                    id: categoryId,
                    data: formData as Partial<ICategory>,
                });
                showMessage.success('Cập nhật danh mục thành công!');
            } else {
                await createCategoryAsync(formData as Partial<ICategory>);
                showMessage.success('Tạo danh mục thành công!');
            }

            router.push(routes.category.url);
        } catch (error: any) {
            showMessage.error(error?.message || 'Có lỗi xảy ra!');
        }
    };

    const isLoading = isLoadingCategory || isLoadingCategories;
    const isSubmitting = isCreating || isUpdating;

    useEffect(() => {
        setBreadcrumb([
            {
                key: routes.category.url,
                href: routes.category.url,
                title: routes.category.title,
            },

            {
                key: 'form',
                title: isEdit ? 'Cập nhật danh mục' : 'Tạo mới danh mục',
            },
        ])
    }, [setBreadcrumb])

    return (
        <Card
            variant='borderless'
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
                            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                        >
                            <FloatingInput
                                required
                                label='Tên danh mục'
                                size="large"
                                placeholder="Nhập tên danh mục"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                        >
                            <FloatingTextArea
                                label='Mô tả'
                                rows={4}
                                placeholder="Nhập mô tả danh mục"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item
                            name="parentId"
                        >
                            <FloatingCascader
                                label='Danh mục cha'
                                size="large"
                                placeholder="Chọn danh mục cha (nếu có)"
                                className="rounded-lg"
                                allowClear
                                changeOnSelect
                                options={convertNestedCategories(buildTree(parentCategories))}
                                onChange={handleParentChange}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold">Trạng thái</span>}
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
                            <h3 className="font-semibold text-gray-900">SEO Meta Tags</h3>

                            <Form.Item
                                name="metaTitle"
                            >
                                <FloatingInput
                                    label='Meta Title'
                                    placeholder="Nhập meta title"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                name="metaDescription"
                            >
                                <FloatingTextArea
                                    label='Meta Description'
                                    rows={3}
                                    placeholder="Nhập meta description"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                name="metaKeywords"
                            >
                                <FloatingInput
                                    label='Meta Keywords'
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
                        {isEdit ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default CategoryForm;