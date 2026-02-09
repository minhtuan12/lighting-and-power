'use client'

import { useChangePassword } from '@/hooks/use-me'
import { Button, Col, Form, Input, Row } from 'antd'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

export default function ChangePassowrd() {
    const t = useTranslations()
    const v = useTranslations('validation')
    const { isLoading, changePassword } = useChangePassword()
    const [form] = Form.useForm()

    const handleSubmit = useCallback((values: any) => {
        changePassword({
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
        })
    }, [])

    return (
        <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
        >
            <Row gutter={30}>
                <Col span={24}>
                    <Form.Item
                        name="oldPassword"
                        required
                        label={
                            <div className="text-base font-semibold">
                                {t('auth.oldPassword')}
                            </div>
                        }
                        rules={[
                            {
                                required: true,
                                message: v('required', {
                                    field: t('auth.oldPassword'),
                                }),
                            },
                        ]}
                    >
                        <Input.Password
                            className="!h-11"
                            placeholder={t('form.enter', {
                                field: t('auth.oldPassword'),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        required
                        name="newPassword"
                        label={
                            <div className="text-base font-semibold">
                                {t('auth.newPassword')}
                            </div>
                        }
                        rules={[
                            {
                                required: true,
                                message: v('required', {
                                    field: t('auth.newPassword'),
                                }),
                            },
                            {
                                min: 6,
                                message: v('min', {
                                    field: t('auth.newPassword'),
                                    min: 6,
                                }),
                            },
                            {
                                pattern: /[A-Z]/,
                                message: v('uppercasePassword'),
                            },
                            {
                                pattern: /[a-z]/,
                                message: v('lowercasePassword'),
                            },
                            {
                                pattern: /[0-9]/,
                                message: v('oneDigitPassword'),
                            },
                            {
                                pattern:
                                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                                message: v('specialCharacterPassword'),
                            },
                        ]}
                    >
                        <Input.Password
                            className="!h-11"
                            placeholder={t('auth.newPassword')}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        required
                        name="confirmPassword"
                        label={
                            <div className="text-base font-semibold">
                                {t('auth.confirmPassword')}
                            </div>
                        }
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: v('passwordNotMatch') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue('newPassword') === value
                                    ) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(
                                        new Error(v('passwordNotMatch')),
                                    )
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            className="!h-11"
                            placeholder={t('auth.confirmPassword')}
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Button
                size="large"
                type="primary"
                htmlType="submit"
                block
                className="space-x-2 mt-5"
                loading={isLoading}
            >
                {t('form.ctaSave')}
            </Button>
        </Form>
    )
}
