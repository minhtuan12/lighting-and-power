'use client'

import { FloatingInput, FloatingInputNumber, FloatingSelect, FloatingTextArea } from '@/components/inputs/FloatingInputs';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { PRODUCT_STATUS_OPTIONS, PRODUCT_TAG_OPTIONS } from '@/constants/common';
import { routes } from '@/constants/routes';
import { useCategories } from '@/hooks/admin/use-categories';
import { useProducts } from '@/hooks/admin/use-products';
import { showMessage } from '@/hooks/use-message';
import { fetchAPI } from '@/lib/api-client';
import { convertNestedCategories } from '@/lib/utils';
import { breadcrumbAtom } from '@/stores';
import { EProductStatus, IProduct } from '@/types/product';
import { Button, Card, Checkbox, Col, Flex, Form, Row, Select, Switch, Upload } from 'antd';
import { useSetAtom } from 'jotai';
import { Plus, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PriceTiers, { PriceTier } from './(components)/PriceTiers';
import Specifications, { Specification } from './(components)/Specifications';
import { useTierManagement } from './use-tier-management';

const ProductForm = () => {
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');
    const router = useRouter();
    const isEdit = !!productId;
    const id = isEdit ? productId : null;
    const [form] = Form.useForm();
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imageFilesPreview, setImageFilesPreview] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<string[]>([]);
    const setBreadcrumb = useSetAtom(breadcrumbAtom);

    const {
        products: allProducts,
        isLoading: isLoadingProducts,
        createProductAsync,
        updateProductAsync,
        isCreating,
        isUpdating,
        getProductById,
    } = useProducts({ status: 'all' });

    const { data: productData, isLoading: isLoadingProduct } = id
        ? getProductById(id)
        : { data: null, isLoading: false };

    const { categories: categoriesData } = useCategories({ view: 'list' });
    const categoriesList = categoriesData?.data || [];

    // Get related products list (exclude current product)
    const relatedProductsList = allProducts?.data?.products
        ?.filter((p: IProduct) => !isEdit || p._id !== id)
        ?.map((p: IProduct) => ({
            value: p._id,
            label: `${p.name} (${p.sku})`
        })) || [];

    const {
        tiers: priceTiers,
        newTier: newPriceTier,
        handleAddTier: addPriceTier,
        handleDeleteTier: deletePriceTier,
        updateNewTierField: updatePriceTierField
    } = useTierManagement<PriceTier>((isEdit && productData?.data) ? productData.data.priceTiers : []);

    const {
        tiers: specifications,
        newTier: newSpecification,
        handleAddTier: addSpecification,
        handleDeleteTier: deleteSpecification,
        updateNewTierField: updateSpecificationField
    } = useTierManagement<Specification>((isEdit && productData?.data) ? productData.data.specifications : []);

    // ==================== Image Upload to Cloudinary ====================
    const uploadImagesToCloudinary = useCallback(async (files: File[]): Promise<string[]> => {
        try {
            const uploadedUrls: string[] = [];

            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'lightingpower');

                const data = await fetchAPI('/admin/upload/image', {
                    method: 'POST',
                    body: formData,
                });
                uploadedUrls.push(data.secure_url);
            }

            return uploadedUrls;
        } catch (error: any) {
            console.error('Image upload error:', error);
            throw new Error(error.message || 'Failed to upload images');
        }
    }, []);

    // ==================== Handle Image Selection ====================
    const handleImageSelect = useCallback((file: File, index: number) => {
        const newFiles = [...imageFiles];
        newFiles[index] = file;
        setImageFiles(newFiles);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPreviews = [...imageFilesPreview];
            newPreviews[index] = reader.result as string;
            setImageFilesPreview(newPreviews);
        };
        reader.readAsDataURL(file);
    }, [imageFiles, imageFilesPreview]);

    const handleAddImage = useCallback(() => {
        setImageFiles([...imageFiles, null as any]);
        setImageFilesPreview([...imageFilesPreview, '']);
    }, [imageFiles, imageFilesPreview]);

    const handleRemoveImageField = useCallback((index: number) => {
        setImageFiles(imageFiles.filter((_, i) => i !== index));
        setImageFilesPreview(imageFilesPreview.filter((_, i) => i !== index));
    }, [imageFiles, imageFilesPreview]);

    const handleSubmit = async (values: any) => {
        try {
            setIsSubmitting(true);

            // Validate that at least one image is selected
            const validFiles = imageFiles.filter(f => f !== null && f !== undefined);

            // Upload images first
            showMessage.loading('Đang tải ảnh lên...');
            let uploadedImageUrls: string[] = [];

            if (isEdit && id) {
                // For edit: only upload new images (that have files)
                uploadedImageUrls = await uploadImagesToCloudinary(validFiles);
            } else {
                // For create: upload all images
                uploadedImageUrls = await uploadImagesToCloudinary(validFiles);
            }

            const formData: Partial<IProduct> = {
                name: values.name,
                sku: values.sku,
                description: values.description,
                shortDescription: values.shortDescription,
                categoryId: values.categoryId || null,
                manufacturer: values.manufacturer,
                origin: values.origin,
                price: values.price,
                priceTiers: priceTiers.length > 0 ? priceTiers : undefined,
                stock: values.stock,
                lowStockThreshold: values.lowStockThreshold,
                unit: values.unit,
                minOrderQuantity: values.minOrderQuantity,
                images: [...productData?.data?.images?.filter((i: string) => imageFilesPreview.includes(i)), ...uploadedImageUrls],
                specifications: specifications.length > 0 ? specifications : undefined,
                metaTitle: values.metaTitle,
                metaDescription: values.metaDescription,
                metaKeywords: values.metaKeywords,
                datasheet: values.datasheet,
                weight: values.weight,
                dimensions: {
                    length: values.dimensionLength,
                    width: values.dimensionWidth,
                    height: values.dimensionHeight,
                },
                status: values.status,
                isFeatured: values.isFeatured ?? false,
                tags: values.tags || [],
                relatedProducts: selectedRelatedProducts.length > 0 ? selectedRelatedProducts : undefined,
            };

            if (isEdit && id) {
                await updateProductAsync({
                    id: id,
                    data: formData,
                });
                showMessage.success('Cập nhật sản phẩm thành công!');
            } else {
                await createProductAsync(formData);
                showMessage.success('Tạo sản phẩm thành công!');
            }

            router.push(routes.product.url);
        } catch (error: any) {
            showMessage.error(error?.message || 'Có lỗi xảy ra!');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==================== Handle Price Tier and Specification ==================== 
    const validatePriceTier = useCallback((tier: Partial<PriceTier>) => {
        return !!(tier.minQuantity && tier.minQuantity > 0 && tier.price && tier.price > 0);
    }, []);

    const validateSpecification = useCallback((spec: Partial<Specification>) => {
        return !!(spec.name && spec.value);
    }, []);

    const handleAddPriceTier = useCallback(() => {
        addPriceTier(validatePriceTier);
    }, [addPriceTier, validatePriceTier]);

    const handleAddSpecification = useCallback(() => {
        addSpecification(validateSpecification);
    }, [addSpecification, validateSpecification]);

    const isLoading = isLoadingProduct || isLoadingProducts;

    useEffect(() => {
        setBreadcrumb([
            { title: 'Quản lý sản phẩm', href: routes.product.url },
            { title: id ? 'Cập nhật' : 'Tạo mới' }
        ]);
    }, [id, setBreadcrumb]);

    // Load product data for edit
    useEffect(() => {
        if (isEdit && productData?.data) {
            const product = productData.data;
            form.setFieldsValue({
                name: product.name,
                sku: product.sku,
                description: product.description,
                shortDescription: product.shortDescription,
                categoryId: product.categoryId,
                manufacturer: product.manufacturer,
                origin: product.origin,
                price: product.price,
                stock: product.stock,
                lowStockThreshold: product.lowStockThreshold,
                unit: product.unit,
                minOrderQuantity: product.minOrderQuantity,
                metaTitle: product.metaTitle,
                metaDescription: product.metaDescription,
                metaKeywords: product.metaKeywords,
                datasheet: product.datasheet,
                dimensionLength: product.dimensions?.length,
                dimensionWidth: product.dimensions?.width,
                dimensionHeight: product.dimensions?.height,
                weight: product.weight,
                status: product.status,
                isFeatured: product.isFeatured,
                tags: product.tags || [],
            });

            if (product.images && product.images.length > 0) {
                setImageFilesPreview(product.images);
                // Don't set imageFiles for existing images
                setImageFiles([]);
            }
            if (product.relatedProducts) setSelectedRelatedProducts(product.relatedProducts as string[]);
        }
    }, [isEdit, productData, form]);

    return (
        <Card
            variant='borderless'
            className="max-w-full rounded-xl shadow-sm max-h-full"
            loading={isLoading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onFinishFailed={(errorInfo) => {
                    showMessage.error(errorInfo.message);
                }}
                initialValues={{
                    status: EProductStatus.draft,
                    isFeatured: false,
                    unit: 'cái',
                    minOrderQuantity: 1,
                    lowStockThreshold: 10,
                }}
                className=''
            >
                {/* Thông tin cơ bản */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                    <Row gutter={32}>
                        <Col span={8}>
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                            >
                                <FloatingInput
                                    required
                                    label='Tên sản phẩm'
                                    size="middle"
                                    className="rounded-lg"
                                />
                            </Form.Item>
                            <Form.Item
                                name="categoryId"
                                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                            >
                                <FloatingSelect
                                    showSearch={{
                                        optionFilterProp: 'label',
                                        filterOption: (input, option) =>
                                            (option?.label as string ?? '')
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                    }}
                                    required
                                    label='Danh mục'
                                    placeholder='Chọn danh mục'
                                    options={convertNestedCategories(categoriesList)}
                                />
                            </Form.Item>
                            <Form.Item
                                name="manufacturer"
                            >
                                <FloatingInput
                                    label='Hãng sản xuất'
                                    placeholder="Nhập hãng sản xuất"
                                    className="rounded-lg"
                                />
                            </Form.Item>
                            <Form.Item
                                name="origin"
                            >
                                <FloatingInput
                                    label='Xuất xứ'
                                    placeholder="Nhập xuất xứ"
                                    className="rounded-lg"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="sku"
                                rules={[{ required: true, message: 'Vui lòng nhập sku!' }]}
                            >
                                <FloatingInput
                                    required
                                    label='SKU'
                                    size="middle"
                                    className="rounded-lg"
                                    onChange={(e) => {
                                        form.setFieldValue('sku', e.target.value?.toUpperCase() || '');
                                    }}
                                />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="price"
                                        rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                                    >
                                        <FloatingInputNumber
                                            required
                                            label='Giá (đ)'
                                            min={0}
                                            className="w-full rounded-lg h-[43px]"
                                            size='small'
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => parseInt(value!.replace(/,/g, ''))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="stock"
                                        rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho!' }]}
                                    >
                                        <FloatingInputNumber
                                            required
                                            label='Tồn kho'
                                            min={0}
                                            className="w-full rounded-lg h-[43px]"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="minOrderQuantity"
                                    >
                                        <FloatingInputNumber
                                            label='Số lượng tối thiểu'
                                            min={1}
                                            className="w-full rounded-lg h-[43px]"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="unit"
                                    >
                                        <FloatingInput
                                            label='Đơn vị'
                                            placeholder="cái, chiếc, gói..."
                                            className="rounded-lg"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="shortDescription"
                            >
                                <FloatingTextArea
                                    rows={4}
                                    label='Mô tả ngắn'
                                    placeholder="Nhập mô tả ngắn sản phẩm (tối đa 500 ký tự)"
                                    className="rounded-lg"
                                    maxLength={500}
                                />
                            </Form.Item>
                            <Form.Item
                                name="lowStockThreshold"
                            >
                                <FloatingInputNumber
                                    label='Ngưỡng cảnh báo tồn kho'
                                    min={0}
                                    className="w-full rounded-lg h-[43px]"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        label={<span className="font-semibold text-base">Mô tả chi tiết</span>}
                        name="description"
                    >
                        <SimpleEditor placeholder='Nhập mô tả chi tiết sản phẩm' />
                    </Form.Item>
                </div>

                {/* Giá theo số lượng */}
                <div className="mb-8 border-t pt-6">
                    <PriceTiers
                        priceTiers={priceTiers}
                        newPriceTier={newPriceTier}
                        onAddTier={handleAddPriceTier}
                        onDeleteTier={deletePriceTier}
                        onUpdateField={updatePriceTierField}
                    />
                </div>

                {/* Thông số kỹ thuật */}
                <div className="mb-8 border-t pt-6">
                    <Specifications
                        specifications={specifications}
                        newSpecification={newSpecification}
                        onAddTier={handleAddSpecification}
                        onDeleteTier={deleteSpecification}
                        onUpdateField={updateSpecificationField}
                    />
                </div>

                {/* Hình ảnh & Kích thước */}
                <div className="mb-8 border-t pt-6 grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
                        <div className="space-y-4">
                            {imageFilesPreview.map((preview, idx) => (
                                <div key={idx} className="flex gap-2 mb-3">
                                    {preview ? (
                                        <Flex justify='space-between' align='center' className='w-full'>
                                            <Flex align='center' gap={10}>
                                                <img src={preview} alt={`product-${idx}`} className="w-12 h-12 object-cover rounded" />
                                                <p className="text-xs font-semibold">✓ Uploaded</p>
                                            </Flex>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<X size={16} />}
                                                onClick={() => handleRemoveImageField(idx)}
                                                className="rounded-lg"
                                            />
                                        </Flex>
                                    ) : (
                                        <>
                                            <Upload
                                                maxCount={1}
                                                beforeUpload={(file) => {
                                                    handleImageSelect(file, idx);
                                                    return false;
                                                }}
                                                accept="image/*"
                                                className="flex-1"
                                            >
                                                <div className="p-3 border-2 border-dashed border-gray-300 rounded text-center hover:border-blue-400 transition-colors cursor-pointer">
                                                    <Plus size={16} className="mx-auto text-gray-400 mb-1" />
                                                    <p className="text-xs text-gray-600">Upload ảnh</p>
                                                </div>
                                            </Upload>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<X size={16} />}
                                                onClick={() => handleRemoveImageField(idx)}
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
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kích thước & Trọng lượng</h3>
                        <Row gutter={32}>
                            <Col>
                                <Form.Item name="dimensionLength">
                                    <FloatingInputNumber label='Chiều dài (cm)' min={0} className="w-full rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item name="dimensionWidth">
                                    <FloatingInputNumber label='Chiều rộng (cm)' min={0} className="w-full rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={32}>
                            <Col>
                                <Form.Item name="dimensionHeight">
                                    <FloatingInputNumber label='Chiều cao (cm)' min={0} className="w-full rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item name="weight">
                                    <FloatingInputNumber label='Trọng lượng (g)' min={0} className="w-full rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="datasheet">
                            <FloatingInput
                                label='File Datasheet'
                                placeholder="URL file PDF"
                                className="rounded-lg"
                            />
                        </Form.Item>
                    </div>
                </div>

                {/* SEO & Trạng thái */}
                <div className="mb-8 border-t pt-6 grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Meta Tags</h3>
                        <Form.Item name="metaTitle">
                            <FloatingInput
                                label='Meta Title'
                                placeholder="SEO title (tối đa 70 ký tự)"
                                maxLength={70}
                                className="rounded-lg"
                            />
                        </Form.Item>
                        <Form.Item name="metaDescription">
                            <FloatingTextArea
                                label='Meta Description'
                                rows={3}
                                placeholder="SEO description (tối đa 160 ký tự)"
                                maxLength={160}
                                className="rounded-lg"
                            />
                        </Form.Item>
                        <Form.Item name="metaKeywords">
                            <FloatingInput
                                label='Meta Keywords'
                                placeholder="Keywords (ngăn cách bởi dấu phẩy)"
                                className="rounded-lg"
                            />
                        </Form.Item>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái & Tag</h3>
                        <Form.Item
                            name="status"
                        >
                            <FloatingSelect
                                label='Trạng thái'
                                options={PRODUCT_STATUS_OPTIONS}
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={10}>
                                <Form.Item
                                    label={<span className="font-semibold">Tag</span>}
                                    name="tags"
                                >
                                    <Checkbox.Group
                                        options={PRODUCT_TAG_OPTIONS}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item
                                    label={<span className="font-semibold">Sản phẩm nổi bật</span>}
                                    name="isFeatured"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Sản phẩm liên quan */}
                <div className="mb-8 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm liên quan</h3>
                    <Select
                        mode="multiple"
                        placeholder="Chọn sản phẩm liên quan"
                        value={selectedRelatedProducts}
                        onChange={setSelectedRelatedProducts}
                        options={relatedProductsList}
                        className="rounded-lg min-w-100"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        size="middle"
                        onClick={() => router.back()}
                        className="rounded-lg px-6"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        size="middle"
                        htmlType="submit"
                        loading={isSubmitting || isCreating || isUpdating}
                        className="rounded-lg px-6 bg-blue-500 hover:bg-blue-600"
                    >
                        {isEdit ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </div>
            </Form>
        </Card >
    );
};

export default ProductForm;
