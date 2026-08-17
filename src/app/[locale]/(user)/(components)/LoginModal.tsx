'use client'
import { useLogin } from '@/hooks/use-me'
import { showMessage } from '@/hooks/use-message'
import { EUserRole } from '@/types/user'
import { Button, Form, Input, Modal } from 'antd'
import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LoginModal({
    open,
    onClose,
}: {
    open: boolean
    onClose: () => void
}) {
    const t = useTranslations()
    const v = useTranslations('validation')
    const { loginAsync, isLoading } = useLogin()
    const [form] = Form.useForm()
    async function submit(values: { emailOrPhone: string; password: string }) {
        try {
            const data = await loginAsync({
                ...values,
                role: EUserRole.user,
            })
            showMessage.success(t('auth.loginSuccess', { name: data?.data?.fullName ?? '' }))
            onClose()
            window.location.reload()
        } catch (error: any) {
            showMessage.error(error?.message || t('auth.loginFailed'))
        }
    }
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={t('common.login')}
            centered
            width={450}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={submit}
                className="pt-3"
            >
                <Form.Item
                    name="emailOrPhone"
                    label={t('auth.emailOrPhone')}
                    rules={[
                        {
                            required: true,
                            message: v('required', {
                                field: t('auth.emailOrPhone'),
                            }),
                        },
                    ]}
                >
                    <Input size="large" />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t('auth.password')}
                    rules={[
                        {
                            required: true,
                            message: v('required', {
                                field: t('auth.password'),
                            }),
                        },
                        {
                            min: 6,
                            message: v('min', {
                                field: t('auth.password'),
                                min: 6,
                            }),
                        },
                    ]}
                >
                    <Input.Password size="large" />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                    icon={<LogIn size={16} />}
                >
                    {t('common.login')}
                </Button>
            </Form>
        </Modal>
    )
}
