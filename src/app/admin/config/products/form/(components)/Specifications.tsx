import { FloatingInput } from "@/components/inputs/FloatingInputs";
import { Button, Col, Row, Table } from "antd";
import { Plus, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

export type Specification = { name: string; value: string };

const Specifications = memo(({
    specifications,
    newSpecification,
    onAddTier,
    onDeleteTier,
    onUpdateField
}: {
    specifications: Specification[];
    newSpecification: Partial<Specification>;
    onAddTier: () => void;
    onDeleteTier: (index: number) => void;
    onUpdateField: <K extends keyof Specification>(field: K, value: Specification[K]) => void;
}) => {
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateField('name', e.target.value);
    }, [onUpdateField]);

    const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateField('value', e.target.value);
    }, [onUpdateField]);

    const columns = useMemo(() => [
        ...(specifications.length === 0 ? [{
            title: '',
            width: 50,
            align: 'center' as const,
            render: () => <i className='text-gray-500'>Ví dụ</i>
        }] : []),
        {
            title: 'Thông số',
            dataIndex: 'name',
            align: 'center' as const,
            render: (val: string) => specifications.length > 0
                ? val
                : <i className='text-gray-500'>{val}</i>
        },
        {
            title: 'Giá trị',
            dataIndex: 'value',
            align: 'center' as const,
            render: (val: string) => specifications.length > 0
                ? val
                : <i className='text-gray-500'>{val}</i>
        },
        ...(specifications.length > 0 ? [{
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
    ], [specifications.length, onDeleteTier]);

    const tableData = useMemo(() =>
        specifications.length > 0 ? specifications : [
            {
                name: 'Độ rộng data bus',
                value: '32-Bit',
            },
            {
                name: 'Họ IC',
                value: 'ARM Cortex M3',
            }
        ], [specifications]
    );

    return (
        <>
            <h3 className="text-lg font-semibold mb-4">Thông số kỹ thuật</h3>
            <Row className='justify-between'>
                <Col span={6}>
                    <Row gutter={[16, 16]} className='mb-3'>
                        <Col span={12}>
                            <FloatingInput
                                label="Thông số"
                                value={newSpecification.name ?? ''}
                                onChange={handleNameChange}
                                className="rounded-lg"
                            />
                        </Col>
                        <Col span={12}>
                            <FloatingInput
                                label="Giá trị"
                                value={newSpecification.value ?? ''}
                                onChange={handleValueChange}
                                className="rounded-lg"
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
                <Col span={12}>
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

export default Specifications;
