"use client"

import { routes } from "@/constants/routes"
import { showMessage } from "@/hooks/use-message"
import { useRegister } from "@/hooks/user/use-register"
import { Button, Card, Form, Input } from "antd"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

export default function () {
    const t = useTranslations()
    const v = useTranslations("validation")
    const router = useRouter()
    const { registerAsync, isRegistering } = useRegister()
    const [form] = Form.useForm()

    const handleSubmit = async (values: any) => {
        try {
            const result = await registerAsync({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                phone: values.phone,
            })

            showMessage.success(t("auth.registerSuccess"))
            window.location.href = routes.dangNhap.url
        } catch (error: any) {
            showMessage.error(error?.message || t("auth.registerFailed"))
        }
    }

    return (
        <div className="w-[450px] mx-auto max-lg:mt-30 max-lg:px-6 max-lg:w-full max-lg:mb-20">
            <Card
                className="w-full backdrop-blur-lg bg-white/30 border border-white/20 shadow-xl"
                style={{
                    background: "rgba(255, 255, 255, 0.21)",
                    backdropFilter: "blur(3.5px)",
                    WebkitBackdropFilter: "blur(3.5px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.75)",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                }}
            >
                <h3 className="text-center font-bold text-2xl mb-5">
                    {t("common.register")}
                </h3>
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="fullName"
                        required
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.fullName")}
                            </div>
                        }
                        rules={[
                            {
                                required: true,
                                message: v("required", {
                                    field: t("auth.fullName"),
                                }),
                            },
                        ]}
                    >
                        <Input
                            className="!h-11"
                            placeholder={t("form.enter", {
                                field: t("auth.fullName"),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.email")}
                            </div>
                        }
                        rules={[
                            {
                                type: "email",
                                message: v("invalid", {
                                    field: t("auth.email"),
                                }),
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
                                                }),
                                            ),
                                        )
                                    }
                                    return Promise.resolve()
                                },
                            }),
                        ]}
                    >
                        <Input
                            className="!h-11"
                            placeholder={t("form.enter", {
                                field: t("auth.email"),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.phone")}
                            </div>
                        }
                        rules={[
                            {
                                pattern: /^[0-9]{10,11}$/,
                                message: v("invalid", {
                                    field: t("auth.phone"),
                                }),
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
                                                }),
                                            ),
                                        )
                                    }
                                    return Promise.resolve()
                                },
                            }),
                        ]}
                    >
                        <Input
                            className="!h-11"
                            placeholder={t("form.enter", {
                                field: t("auth.phone"),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        required
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

                    <Form.Item
                        required
                        name="confirmPassword"
                        label={
                            <div className="text-base font-semibold">
                                {t("auth.confirmPassword")}
                            </div>
                        }
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: v("passwordNotMatch") },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(
                                        new Error(v("passwordNotMatch")),
                                    )
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
                    >
                        {t("common.register")}
                    </Button>
                </Form>
            </Card>
        </div>
    )
}
