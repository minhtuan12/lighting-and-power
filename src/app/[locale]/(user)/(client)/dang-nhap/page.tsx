"use client"

import { routes } from "@/constants/routes"
import { useLogin } from "@/hooks/use-me"
import { showMessage } from "@/hooks/use-message"
import { EUserRole } from "@/types/user"
import { Button, Card, Form, Input } from "antd"
import { LogIn } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useCallback } from "react"

export default function () {
    const t = useTranslations()
    const v = useTranslations("validation")
    const { loginAsync, isLoading: isLoginLoading, } = useLogin()
    const [form] = Form.useForm()
    const searchParams = useSearchParams()

    const handleSubmit = useCallback(async (values: any) => {
        try {
            const data = await loginAsync({
                emailOrPhone: values.emailOrPhone,
                password: values.password,
                role: EUserRole.user,
            })

            showMessage.success(t("auth.loginSuccess", { name: data?.data?.fullName ?? '' }))
            const redirectUrl = searchParams.get('redirect')

            if (redirectUrl) {
                window.location.href = redirectUrl
            } else {
                window.location.href = routes.trangChu.url
            }
        } catch (error: any) {
            showMessage.error(error?.message || t("auth.loginFailed"))
        }
    }, [loginAsync, searchParams, t])

    return (
        <div className="w-full mt-10 flex items-center justify-center relative top-1/2">
            <Card
                className="w-[450px] h-fit backdrop-blur-lg bg-white/30 border border-white/20 shadow-xl"
                style={{
                    background: "rgba(255, 255, 255, 0.21)",
                    backdropFilter: "blur(3.5px)",
                    WebkitBackdropFilter: "blur(3.5px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.75)",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                }}
            >
                <h3 className="text-center font-bold text-2xl mb-6">
                    {t("common.login")}
                </h3>
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        required
                        name="emailOrPhone"
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.emailOrPhone")}
                            </div>
                        }
                        rules={[
                            {
                                required: true,
                                message: v("required", {
                                    field: t("auth.emailOrPhone"),
                                }),
                            },
                        ]}
                    >
                        <Input
                            className="!h-11"
                            placeholder={t("form.enter", {
                                field: t("auth.emailOrPhone"),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        required
                        name="password"
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.password")}
                            </div>
                        }
                        rules={[
                            {
                                required: true,
                                message: v("required", {
                                    field: t("auth.password"),
                                }),
                            },
                            {
                                min: 6,
                                message: v("min", {
                                    field: t("auth.password"),
                                    min: 6,
                                }),
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
                                pattern:
                                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                                message: v("specialCharacterPassword"),
                            },
                        ]}
                    >
                        <Input.Password
                            className="!h-11"
                            placeholder={t("form.enter", {
                                field: t("auth.password"),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Button
                        size="large"
                        type="primary"
                        htmlType="submit"
                        loading={isLoginLoading}
                        block
                        className="space-x-2"
                    >
                        <LogIn size={16} />
                        {t("common.login")}
                    </Button>
                </Form>
            </Card>
        </div>
    )
}
