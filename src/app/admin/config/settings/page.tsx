'use client'

import { FloatingInput } from '@/components/inputs/FloatingInputs';
import { routes } from '@/constants/routes';
import { useConfig } from '@/hooks/admin/use-config';
import { showMessage } from '@/hooks/use-message';
import { breadcrumbAtom } from '@/stores';
import { IConfig } from '@/types/config';
import { Button, Card, Col, Form, Row, Space } from 'antd';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

const social = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'Youtube' },
    { value: 'tiktok', label: 'Tiktok' },
    { value: 'zalo', label: 'Zalo' },
    { value: 'telegram', label: 'Telegram' },
]

export const Settings = () => {
    const [form] = Form.useForm();
    const setBreadcrumb = useSetAtom(breadcrumbAtom);

    const {
        isLoading,
        isUpdating,
        updateConfigAsync,
        config,
    } = useConfig();

    const handleSubmit = async (values: any) => {
        try {
            let configData: Omit<IConfig, '_id'> = {
                companyName: values.companyName,
                hotline: values.hotline,
                email: values.email,
                address: values.address,
                workingHours: values.workingHours,
                social: {
                    facebook: values.facebook,
                    youtube: values.youtube,
                    tiktok: values.tiktok,
                    zalo: values.zalo,
                    telegram: values.telegram,
                },
            };

            await updateConfigAsync({ data: configData });
            showMessage.success('Cập nhật tài liệu thành công');
        } catch (error: any) {
            showMessage.error(error.message || 'Có lỗi xảy ra');
        }
    };

    useEffect(() => {
        setBreadcrumb([{ title: routes.config.title }]);
    }, [setBreadcrumb])

    useEffect(() => {
        if (config) {
            form.setFieldsValue({
                companyName: config.companyName,
                hotline: config.hotline,
                email: config.email,
                address: config.address,
                workingHours: config.workingHours,
                social: config.social,
            });
        }
    }, [config?._id]);

    return (
        <Card
            variant='borderless'
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
            loading={isLoading}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Row gutter={64}>
                    <Col span={12}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin</h3>
                        <Row gutter={32}>
                            <Col span={24}>
                                <Form.Item
                                    name="companyName"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                                >
                                    <FloatingInput required label='Tên công ty' placeholder="Nhập tên công ty" />
                                </Form.Item>

                                <Form.Item
                                    name="hotline"
                                    rules={[{ required: true, message: 'Vui lòng nhập hotline' }]}
                                >
                                    <FloatingInput required label='Hotline' placeholder="Hotline" />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    rules={[{ required: true, message: 'Vui lòng nhập email' }]}
                                >
                                    <FloatingInput required label='Email' placeholder="Email" />
                                </Form.Item>
                                <Form.Item
                                    name="address"
                                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                                >
                                    <FloatingInput required label='Địa chỉ' placeholder="Địa chỉ" />
                                </Form.Item>

                                <Form.Item
                                    name="workingHours"
                                    rules={[{ required: true, message: 'Vui lòng nhập giờ làm việc' }]}
                                >
                                    <FloatingInput required label='Giờ làm việc' placeholder="Giờ làm việc" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ</h3>
                        {social.map(({ label, value }) => (
                            <Row key={label}>
                                <Col span={24}>
                                    <Form.Item name={value}>
                                        <FloatingInput label={label} placeholder={`Link ${label}`} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        ))}
                    </Col>
                </Row>

                <Form.Item>
                    <Space className='justify-end w-full'>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isUpdating}
                        >
                            Cập nhật
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default Settings;
