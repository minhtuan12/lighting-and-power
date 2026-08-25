'use client'
import { useLogin } from '@/hooks/use-me'
import { showMessage } from '@/hooks/use-message'
import { EUserRole } from '@/types/user'
import { Button, Flex, Form, Input, Modal, Tabs } from 'antd'
import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Icon } from '@/components/Icon'
import { useRegister } from '@/hooks/user/use-register'
import { authModalTabAtom, loginModalAtom } from '@/stores/ui'
import { useAtom } from 'jotai'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
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
            onSuccess()
        } catch (error: any) {
            showMessage.error(error?.message || t('auth.loginFailed'))
        }
    }

    return (
        <Form form={form} layout="vertical" onFinish={submit} className="!pt-3">
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
                <Input size="large" placeholder='Nhập email hoặc số điện thoại' />
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
                <Input.Password size="large" placeholder='Nhập mật khẩu' />
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
    )
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
    const t = useTranslations()
    const v = useTranslations("validation")
    const { registerAsync, isRegistering } = useRegister()
    const [form] = Form.useForm()

    const handleSubmit = async (values: any) => {
        try {
            await registerAsync({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                phone: values.phone,
            })

            showMessage.success(t("auth.registerSuccess"))
            onSuccess()
        } catch (error: any) {
            showMessage.error(error?.message || t("auth.registerFailed"))
        }
    }

    return (
        <Form form={form} onFinish={handleSubmit} layout="vertical" className="pt-3">
            <Form.Item
                name="fullName"
                required
                label={<div className="font-semibold">{t("auth.fullName")}</div>}
                rules={[
                    {
                        required: true,
                        message: v("required", { field: t("auth.fullName") }),
                    },
                ]}
            >
                <Input
                    className="!h-11"
                    placeholder={t("form.enter", { field: t("auth.fullName") })}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="email"
                label={<div className="font-semibold">{t("auth.email")}</div>}
                rules={[
                    {
                        type: "email",
                        message: v("invalid", { field: t("auth.email") }),
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const phone = getFieldValue("phone")
                            if (!value && !phone) {
                                return Promise.reject(
                                    new Error(
                                        v("requiredOne", {
                                            field: t("auth.email"),
                                            field2: t("auth.phone"),
                                        })
                                    )
                                )
                            }
                            return Promise.resolve()
                        },
                    }),
                ]}
            >
                <Input
                    className="!h-11"
                    placeholder={t("form.enter", { field: t("auth.email") })}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="phone"
                label={<div className="font-semibold">{t("auth.phone")}</div>}
                rules={[
                    {
                        pattern: /^[0-9]{10,11}$/,
                        message: v("invalid", { field: t("auth.phone") }),
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const email = getFieldValue("email")
                            if (!value && !email) {
                                return Promise.reject(
                                    new Error(
                                        v("requiredOne", {
                                            field: t("auth.email"),
                                            field2: t("auth.phone"),
                                        })
                                    )
                                )
                            }
                            return Promise.resolve()
                        },
                    }),
                ]}
            >
                <Input
                    className="!h-11"
                    placeholder={t("form.enter", { field: t("auth.phone") })}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="password"
                required
                label={<div className="font-semibold">{t("auth.password")}</div>}
                rules={[
                    {
                        required: true,
                        message: v("required", { field: t("auth.password") }),
                    },
                    {
                        min: 6,
                        message: v("min", { field: t("auth.password"), min: 6 }),
                    },
                    {
                        pattern: /[A-Z]/,
                        message: v("uppercasePassword"),
                    },
                    {
                        pattern: /[a-z]/,
                        message: v("lowercasePassword"),
                    },
                    {
                        pattern: /[0-9]/,
                        message: v("oneDigitPassword"),
                    },
                    {
                        pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                        message: v("specialCharacterPassword"),
                    },
                ]}
            >
                <Input.Password
                    className="!h-11"
                    placeholder={t("form.enter", { field: t("auth.password") })}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                required
                name="confirmPassword"
                label={<div className="font-semibold">{t("auth.confirmPassword")}</div>}
                dependencies={["password"]}
                rules={[
                    { required: true, message: v("passwordNotMatch") },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject(new Error(v("passwordNotMatch")))
                        },
                    }),
                ]}
            >
                <Input.Password
                    className="!h-11"
                    placeholder={t("auth.confirmPassword")}
                    size="large"
                />
            </Form.Item>

            <Button
                size="large"
                type="primary"
                htmlType="submit"
                loading={isRegistering}
                block
                icon={<Icon src={"/images/logo-only.png"} size={20} />}
            >
                {t("common.register")}
            </Button>
        </Form>
    )
}

export default function LoginModal() {
    const t = useTranslations()
    const [open, setOpen] = useAtom(loginModalAtom)
    const [activeTab, setActiveTab] = useAtom(authModalTabAtom)
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (searchParams.get('login') === 'true') {
            setOpen(true)
            setActiveTab('login')
            // Optional: remove login=true from URL
            const params = new URLSearchParams(searchParams)
            params.delete('login')
            const newQuery = params.toString()
            router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false })
        }
        if (searchParams.get('register') === 'true') {
            setOpen(true)
            setActiveTab('register')
            const params = new URLSearchParams(searchParams)
            params.delete('register')
            const newQuery = params.toString()
            router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false })
        }
    }, [searchParams, setOpen, router, pathname])

    const handleSuccess = (isRegister: boolean = false) => {
        if (isRegister) {
            setActiveTab('login')
            return
        }

        setOpen(false)
        const redirectUrl = searchParams.get('redirect')
        if (redirectUrl) {
            window.location.href = redirectUrl
        } else {
            window.location.reload()
        }
    }

    const items = [
        {
            key: 'login',
            label: <div className="text-base font-semibold px-4">{t('common.login')}</div>,
            children: <LoginForm onSuccess={() => handleSuccess(false)} />
        },
        {
            key: 'register',
            label: <div className="text-base font-semibold px-4">{t('common.register')}</div>,
            children: <RegisterForm onSuccess={() => handleSuccess(true)} />
        }
    ]

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            footer={null}
            centered
            width={450}
        >
            <Flex justify='center' className='!mb-4'><Icon src={"/images/logo-vertical.png"} size={300} /></Flex>
            <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'login' | 'register')} items={items} centered />
        </Modal>
    )
}
