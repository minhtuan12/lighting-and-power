'use client'

import { Icon } from "@/components/Icon";
import { PRODUCT_TAG_OPTIONS } from "@/constants/common";
import { hasValidData } from "@/lib/utils";
import { FilterState, IProductFilterOptions, IProductFilterParams } from "@/types/product";
import { Button, Card, Checkbox, Collapse, Flex, InputNumber, Slider, Space } from "antd";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const FilterHeader = <Flex gap={10}><Icon src="/images/filter.png" size={15} />Lọc sản phẩm</Flex>;

export default function FiltersClient({
    filterOptions,
    currentFilters
}: {
    filterOptions: IProductFilterOptions;
    currentFilters: IProductFilterParams;
}) {
    const t = useTranslations('product.filter');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state từ currentFilters (từ URL)
    const [filterState, setFilterState] = useState<FilterState>(() => ({
        categories: currentFilters.categories || [],
        manufacturers: currentFilters.manufacturers || [],
        origins: currentFilters.origins || [],
        units: currentFilters.units || [],
        tags: currentFilters.tags || [],
        priceRange: [
            currentFilters.priceMin || filterOptions.priceRange?.min || 0,
            currentFilters.priceMax || filterOptions.priceRange?.max || 0
        ],
        weightRange: [
            currentFilters.weightMin || filterOptions.weightRange?.min || 0,
            currentFilters.weightMax || filterOptions.weightRange?.max || 0
        ],
        dimensionRanges: {
            length: [
                currentFilters.lengthMin || filterOptions.dimensionRanges?.length?.min || 0,
                currentFilters.lengthMax || filterOptions.dimensionRanges?.length?.max || 0
            ],
            width: [
                currentFilters.widthMin || filterOptions.dimensionRanges?.width?.min || 0,
                currentFilters.widthMax || filterOptions.dimensionRanges?.width?.max || 0
            ],
            height: [
                currentFilters.heightMin || filterOptions.dimensionRanges?.height?.min || 0,
                currentFilters.heightMax || filterOptions.dimensionRanges?.height?.max || 0
            ]
        },
        specifications: currentFilters.specifications || {},
    }));

    const renderFilterContent = useCallback((key: string, values: any) => {
        switch (key) {
            // ============= CHECKBOX LIST (Categories, Manufacturers, Origins, Units, Tags) =============
            case 'manufacturers':
            case 'origins':
            case 'units':
            case 'tags':
                if (!Array.isArray(values) || values.length === 0) return null;

                return (
                    <Checkbox.Group
                        value={filterState[key as keyof FilterState] as string[]}
                        onChange={(checkedValues) => handleFilterChange(key, checkedValues)}
                        className="w-full"
                    >
                        <Flex vertical gap={8}>
                            {values.map((item: any) => {
                                const label = key === 'tags' ?
                                    (PRODUCT_TAG_OPTIONS.find(i => i.value === item.value)?.label ?? 'Không xác định')
                                    : item.value;

                                return <Checkbox
                                    key={item._id || item.value}
                                    value={item._id || item.value}
                                    className="!ml-0"
                                >
                                    <span className="text-[13px]">
                                        {label}
                                        <span className="text-gray-500 ml-1">({item.count})</span>
                                    </span>
                                </Checkbox>
                            })}
                        </Flex>
                    </Checkbox.Group>
                );

            // ============= PRICE RANGE =============
            case 'priceRange':
                if (!values?.min || !values?.max) return null;

                return (
                    <Space orientation="vertical" className="w-full" size={12}>
                        <Slider
                            range
                            min={values.min}
                            max={values.max}
                            value={filterState.priceRange}
                            onChange={(value) => handleFilterChange('priceRange', value)}
                            tooltip={{
                                formatter: (value) => `${value?.toLocaleString('vi-VN')}đ`
                            }}
                        />
                        <Flex gap={8} align="center">
                            <InputNumber
                                min={values.min}
                                max={values.max}
                                value={filterState.priceRange[0]}
                                onChange={(value) =>
                                    handleFilterChange('priceRange', [value || values.min, filterState.priceRange[1]])
                                }
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                className="flex-1 rounded-2"
                                size="small"
                            />
                            <span>-</span>
                            <InputNumber
                                min={values.min}
                                max={values.max}
                                value={filterState.priceRange[1]}
                                onChange={(value) =>
                                    handleFilterChange('priceRange', [filterState.priceRange[0], value || values.max])
                                }
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                className="flex-1 rounded-2"
                                size="small"
                            />
                        </Flex>
                        <p className="text-xs text-gray-500 text-center">
                            {values.min.toLocaleString('vi-VN')}đ - {values.max.toLocaleString('vi-VN')}đ
                        </p>
                    </Space>
                );

            // ============= WEIGHT RANGE =============
            case 'weightRange':
                if (!values?.min || !values?.max || values.hasWeight === 0) return null;

                return (
                    <Space direction="vertical" className="w-full" size={12}>
                        <div className="text-xs text-gray-500 mb-2">
                            {values.hasWeight} sản phẩm có thông tin trọng lượng
                        </div>
                        <Slider
                            range
                            min={values.min}
                            max={values.max}
                            value={filterState.weightRange}
                            onChange={(value) => handleFilterChange('weightRange', value)}
                            tooltip={{
                                formatter: (value) => `${value}g`
                            }}
                        />
                        <Flex gap={8} align="center">
                            <InputNumber
                                min={values.min}
                                max={values.max}
                                value={filterState.weightRange[0]}
                                onChange={(value) =>
                                    handleFilterChange('weightRange', [value || values.min, filterState.weightRange[1]])
                                }
                                addonAfter="g"
                                className="flex-1"
                                size="small"
                            />
                            <span>-</span>
                            <InputNumber
                                min={values.min}
                                max={values.max}
                                value={filterState.weightRange[1]}
                                onChange={(value) =>
                                    handleFilterChange('weightRange', [filterState.weightRange[0], value || values.max])
                                }
                                addonAfter="g"
                                className="flex-1"
                                size="small"
                            />
                        </Flex>
                    </Space>
                );

            // ============= DIMENSION RANGES =============
            case 'dimensionRanges':
                if (!values) return null;

                return (
                    <Space direction="vertical" className="w-full" size={16}>
                        {/* Length */}
                        {values.length?.hasValue > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    Chiều dài ({values.length.hasValue} SP)
                                </div>
                                <Slider
                                    range
                                    min={values.length.min}
                                    max={values.length.max}
                                    value={filterState.dimensionRanges.length}
                                    onChange={(value) =>
                                        handleFilterChange('dimensionRanges', {
                                            ...filterState.dimensionRanges,
                                            length: value
                                        })
                                    }
                                    tooltip={{ formatter: (value) => `${value}mm` }}
                                />
                                <Flex gap={8} align="center" className="mt-2">
                                    <InputNumber
                                        min={values.length.min}
                                        max={values.length.max}
                                        value={filterState.dimensionRanges.length[0]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                length: [value || values.length.min, filterState.dimensionRanges.length[1]]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                    <span>-</span>
                                    <InputNumber
                                        min={values.length.min}
                                        max={values.length.max}
                                        value={filterState.dimensionRanges.length[1]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                length: [filterState.dimensionRanges.length[0], value || values.length.max]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                </Flex>
                            </div>
                        )}

                        {/* Width */}
                        {values.width?.hasValue > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    Chiều rộng ({values.width.hasValue} SP)
                                </div>
                                <Slider
                                    range
                                    min={values.width.min}
                                    max={values.width.max}
                                    value={filterState.dimensionRanges.width}
                                    onChange={(value) =>
                                        handleFilterChange('dimensionRanges', {
                                            ...filterState.dimensionRanges,
                                            width: value
                                        })
                                    }
                                    tooltip={{ formatter: (value) => `${value}mm` }}
                                />
                                <Flex gap={8} align="center" className="mt-2">
                                    <InputNumber
                                        min={values.width.min}
                                        max={values.width.max}
                                        value={filterState.dimensionRanges.width[0]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                width: [value || values.width.min, filterState.dimensionRanges.width[1]]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                    <span>-</span>
                                    <InputNumber
                                        min={values.width.min}
                                        max={values.width.max}
                                        value={filterState.dimensionRanges.width[1]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                width: [filterState.dimensionRanges.width[0], value || values.width.max]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                </Flex>
                            </div>
                        )}

                        {/* Height */}
                        {values.height?.hasValue > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    Chiều cao ({values.height.hasValue} SP)
                                </div>
                                <Slider
                                    range
                                    min={values.height.min}
                                    max={values.height.max}
                                    value={filterState.dimensionRanges.height}
                                    onChange={(value) =>
                                        handleFilterChange('dimensionRanges', {
                                            ...filterState.dimensionRanges,
                                            height: value
                                        })
                                    }
                                    tooltip={{ formatter: (value) => `${value}mm` }}
                                />
                                <Flex gap={8} align="center" className="mt-2">
                                    <InputNumber
                                        min={values.height.min}
                                        max={values.height.max}
                                        value={filterState.dimensionRanges.height[0]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                height: [value || values.height.min, filterState.dimensionRanges.height[1]]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                    <span>-</span>
                                    <InputNumber
                                        min={values.height.min}
                                        max={values.height.max}
                                        value={filterState.dimensionRanges.height[1]}
                                        onChange={(value) =>
                                            handleFilterChange('dimensionRanges', {
                                                ...filterState.dimensionRanges,
                                                height: [filterState.dimensionRanges.height[0], value || values.height.max]
                                            })
                                        }
                                        addonAfter="mm"
                                        size="small"
                                        className="flex-1"
                                    />
                                </Flex>
                            </div>
                        )}
                    </Space>
                );

            // ============= SPECIFICATIONS (Dynamic) =============
            case 'specifications':
                if (!Array.isArray(values) || values.length === 0) return null;

                // Tạo nested Collapse cho specifications
                const specItems = values.map((spec) => ({
                    key: spec.name,
                    label: (
                        <span className="text-[13px]">
                            {spec.name}
                            <span className="text-gray-500 ml-1">({spec.totalCount})</span>
                        </span>
                    ),
                    children: (
                        <Checkbox.Group
                            value={filterState.specifications[spec.name] || []}
                            onChange={(checkedValues) =>
                                handleFilterChange('specifications', {
                                    ...filterState.specifications,
                                    [spec.name]: checkedValues
                                })
                            }
                            className="w-full"
                        >
                            <Flex vertical gap={8} className="max-h-[200px] overflow-y-auto">
                                {spec.values.map((v: any) => (
                                    <Checkbox key={v.value} value={v.value} className="!ml-0">
                                        <span className="text-[13px]">
                                            {v.value}
                                            <span className="text-gray-500 ml-1">({v.count})</span>
                                        </span>
                                    </Checkbox>
                                ))}
                            </Flex>
                        </Checkbox.Group>
                    )
                }));

                return (
                    <Collapse
                        items={specItems}
                        ghost
                        size="small"
                        className="!bg-gray-50"
                    />
                );

            default:
                return null;
        }
    }, [filterState]);

    const handleFilterChange = (key: string, value: any) => {
        setFilterState(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getLabel = useCallback((key: string): string | null => {
        const labels: Record<string, string> = {
            manufacturers: t('fields.manufacturers'),
            origins: t('fields.origins'),
            units: t('fields.units'),
            tags: t('fields.tags'),
            priceRange: t('fields.priceRange'),
            weightRange: t('fields.weightRange'),
            dimensionRanges: t('fields.dimensionRanges'),
            specifications: t('fields.specifications'),
        };
        return labels[key] || null;
    }, [t]);

    // Build URL từ filterState
    const buildURL = (filters: any) => {
        const params = new URLSearchParams();

        // Manufacturers
        if (filters.manufacturers.length > 0) {
            params.set('manufacturers', filters.manufacturers.join(','));
        }

        // Origins
        if (filters.origins.length > 0) {
            params.set('origins', filters.origins.join(','));
        }

        // Units
        if (filters.units.length > 0) {
            params.set('units', filters.units.join(','));
        }

        // Tags
        if (filters.tags.length > 0) {
            params.set('tags', filters.tags.join(','));
        }

        // Price range - chỉ thêm nếu khác với default
        if (filters.priceRange[0] !== filterOptions.priceRange?.min) {
            params.set('priceMin', filters.priceRange[0].toString());
        }
        if (filters.priceRange[1] !== filterOptions.priceRange?.max) {
            params.set('priceMax', filters.priceRange[1].toString());
        }

        // Weight range
        if (filters.weightRange[0] !== filterOptions.weightRange?.min) {
            params.set('weightMin', filters.weightRange[0].toString());
        }
        if (filters.weightRange[1] !== filterOptions.weightRange?.max) {
            params.set('weightMax', filters.weightRange[1].toString());
        }

        // Dimensions
        if (filters.dimensionRanges.length[0] !== filterOptions.dimensionRanges?.length?.min) {
            params.set('lengthMin', filters.dimensionRanges.length[0].toString());
        }
        if (filters.dimensionRanges.length[1] !== filterOptions.dimensionRanges?.length?.max) {
            params.set('lengthMax', filters.dimensionRanges.length[1].toString());
        }
        if (filters.dimensionRanges.width[0] !== filterOptions.dimensionRanges?.width?.min) {
            params.set('widthMin', filters.dimensionRanges.width[0].toString());
        }
        if (filters.dimensionRanges.width[1] !== filterOptions.dimensionRanges?.width?.max) {
            params.set('widthMax', filters.dimensionRanges.width[1].toString());
        }
        if (filters.dimensionRanges.height[0] !== filterOptions.dimensionRanges?.height?.min) {
            params.set('heightMin', filters.dimensionRanges.height[0].toString());
        }
        if (filters.dimensionRanges.height[1] !== filterOptions.dimensionRanges?.height?.max) {
            params.set('heightMax', filters.dimensionRanges.height[1].toString());
        }

        // Specifications
        Object.entries(filters.specifications).forEach(([name, values]: any) => {
            if (values.length > 0) {
                params.set(`spec_${encodeURIComponent(name)}`, values.join(','));
            }
        });

        // Preserve existing params (search, sortBy, sortOrder)
        const currentSearch = searchParams.get('search');
        if (currentSearch) params.set('search', currentSearch);

        const currentSortBy = searchParams.get('sortBy');
        if (currentSortBy) params.set('sortBy', currentSortBy);

        const currentSortOrder = searchParams.get('sortOrder');
        if (currentSortOrder) params.set('sortOrder', currentSortOrder);

        // Reset page to 1 khi apply filter
        params.set('page', '1');

        return `${pathname}?${params.toString()}`;
    };

    const handleApplyFilters = () => {
        const url = buildURL(filterState);
        router.push(url);
    };

    const handleResetFilters = () => {
        const resetState: FilterState = {
            manufacturers: [],
            origins: [],
            units: [],
            tags: [],
            priceRange: [
                filterOptions.priceRange?.min ?? 0,
                filterOptions.priceRange?.max ?? 0
            ],
            weightRange: [
                filterOptions.weightRange?.min ?? 0,
                filterOptions.weightRange?.max ?? 0
            ],
            dimensionRanges: {
                length: [
                    filterOptions.dimensionRanges?.length?.min ?? 0,
                    filterOptions.dimensionRanges?.length?.max ?? 0
                ],
                width: [
                    filterOptions.dimensionRanges?.width?.min ?? 0,
                    filterOptions.dimensionRanges?.width?.max ?? 0
                ],
                height: [
                    filterOptions.dimensionRanges?.height?.min ?? 0,
                    filterOptions.dimensionRanges?.height?.max ?? 0
                ]
            },
            specifications: {},
        };
        setFilterState(resetState);
        router.push(pathname); // Clear all params
    };

    // Build collapse items
    const collapseItems = Object.entries(filterOptions)
        .filter(([key, values]) => {
            const label = getLabel(key);
            return label && hasValidData(values);
        })
        .map(([key, values]) => ({
            key,
            label: (
                <span className="text-[13px] font-medium">
                    {getLabel(key)}
                </span>
            ),
            children: renderFilterContent(key, values)
        }));

    return <Flex className="w-full" vertical gap={10}>
        <Card title={FilterHeader} className="w-full card-custom">
            <Flex vertical className="py-2">
                <Collapse
                    items={collapseItems}
                    defaultActiveKey={['manufacturers']}
                    ghost
                    className="[&_.ant-collapse-item]:!border-b [&_.ant-collapse-item]:!border-[#CCCCCC] [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-header]:!px-4 [&_.ant-collapse-header]:hover:!bg-[#c0e8fe] [&_.ant-collapse-content-box]:!px-4"
                />
            </Flex>
        </Card>
        <Flex gap={8} className="mt-6 px-4" justify="end">
            <Button
                onClick={handleResetFilters}
            >
                {t('clearAll')}
            </Button>
            <Button
                type="primary"
                onClick={handleApplyFilters}
            >
                {t('apply')}
            </Button>
        </Flex>
    </Flex>
}
