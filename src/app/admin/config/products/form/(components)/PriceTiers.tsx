import { FloatingInputNumber } from "@/components/inputs/FloatingInputs";
import { Button, Col, Row, Table } from "antd";
import { Plus, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

export type PriceTier = { minQuantity: number; price: number };

const PriceTiers = memo(({
    priceTiers,
    newPriceTier,
    onAddTier,
    onDeleteTier,
    onUpdateField
}: {
    priceTiers: PriceTier[];
    newPriceTier: Partial<PriceTier>;
    onAddTier: () => void;
    onDeleteTier: (index: number) => void;
    onUpdateField: <K extends keyof PriceTier>(field: K, value: PriceTier[K]) => void;
}) => {
    const handleMinQuantityChange = useCallback((val: number | null) => {
        onUpdateField('minQuantity', val as number);
    }, [onUpdateField]);

    const handlePriceChange = useCallback((val: number | null) => {
        onUpdateField('price', val as number);
    }, [onUpdateField]);

    const columns = useMemo(() => [
        ...(priceTiers.length === 0 ? [{
            title: '',
            width: 50,
            align: 'center' as const,
            render: () => <i className='text-gray-500'>Ví dụ</i>
        }] : []),
        {
            title: 'Số lượng tối thiểu',
            dataIndex: 'minQuantity',
            width: 200,
            align: 'center' as const,
            render: (val: number) => priceTiers.length > 0
                ? val.toLocaleString('vi-VN')
                : <i className='text-gray-500'>{val}</i>
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            align: 'center' as const,
            width: 150,
            render: (val: number) => priceTiers.length > 0
                ? <span>{val.toLocaleString('vi-VN')} đ</span>
                : <i className='text-gray-500'>{val.toLocaleString('vi-VN')}</i>
        },
        ...(priceTiers.length > 0 ? [{
            title: '',
            width: 50,
            align: 'center' as const,
            render: (_: unknown, __: unknown, idx: number) => (
                <Button
                    size="small"
                    danger
                    icon={<X size={14} />}
                    onClick={() => onDeleteTier(idx)}
                />
            )
        }] : [])
    ], [priceTiers.length, onDeleteTier]);

    const tableData = useMemo(() =>
        priceTiers.length > 0 ? priceTiers : [
            { minQuantity: 1, price: 10000 },
            { minQuantity: 10, price: 80000 }
        ], [priceTiers]
    );

    return (
        <>
            <h3 className="text-lg font-semibold mb-4">Bậc giá theo số lượng</h3>
            <Row className='justify-between'>
                <Col span={6}>
                    <Row gutter={[16, 16]} className='mb-3'>
                        <Col span={12}>
                            <FloatingInputNumber
                                label="Số lượng tối thiểu"
                                min={1}
                                value={newPriceTier.minQuantity ?? null}
                                onChange={handleMinQuantityChange as any}
                                className="rounded-lg"
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => parseInt(value!.replace(/,/g, ''))}
                            />
                        </Col>
                        <Col span={12}>
                            <FloatingInputNumber
                                label="Giá (VNĐ)"
                                min={0}
                                value={newPriceTier.price ?? null}
                                onChange={handlePriceChange as any}
                                className="rounded-lg"
                                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                parser={value => value ? parseInt(value.replace(/,/g, '')) : 0}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Button
                                type='primary'
                                icon={<Plus size={16} />}
                                onClick={onAddTier}
                                className="rounded-lg w-full"
                            >
                                Thêm
                            </Button>
                        </Col>
                    </Row>
                </Col>
                <Col span={10}>
                    <Table
                        size="small"
                        rowKey={(_, idx) => idx?.toString() ?? '0'}
                        columns={columns as any}
                        dataSource={tableData}
                        pagination={false}
                    />
                </Col>
            </Row>
        </>
    );
});

export default PriceTiers;
