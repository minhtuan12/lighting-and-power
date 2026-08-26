"use client"

import { FloatingInput, FloatingSelect, FloatingTextArea } from "@/components/inputs/FloatingInputs"
import Loading from "@/components/Loading"
import { CHECKOUT_FLOW_KEY, CHECKOUT_FLOW_TTL_MS } from "@/constants/common"
import { routes } from "@/constants/routes"
import { useAuth } from "@/hooks/use-me"
import { showMessage } from "@/hooks/use-message"
import { fetchAPI } from "@/lib/api-client"
import { getProvinces } from "@/lib/utils"
import { checkedOutItemsAtom } from "@/stores"
import { ICartItem } from "@/types/cart"
import { Province, Ward } from "@/types/general"
import { Button, Card, Col, Divider, Form, Radio, Row, Typography } from "antd"
import { useAtom } from "jotai"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const { Text } = Typography

const formatPrice = (value: number) =>
    value.toLocaleString("vi-VN") + " đ"

const getEffectivePrice = (
    quantity: number,
    priceTiers?: { minQuantity: number; price: number }[],
    fallbackPrice?: number,
): number => {
    if (!priceTiers || priceTiers.length === 0) return fallbackPrice ?? 0

    const sorted = [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity)
    const tier = sorted.find((t) => quantity >= t.minQuantity)
    return tier ? tier.price : (fallbackPrice ?? priceTiers[0].price)
}

export default function OrderCheckoutPage() {
    const t = useTranslations()
    const v = useTranslations('validation')
    const router = useRouter()
    const { user, isAuthenticated, isLoading: loadingAuth } = useAuth()
    const [checkedOutItems, setCheckedOutItems] = useAtom(checkedOutItemsAtom)
    const queryClient = useQueryClient()
    const [form] = Form.useForm()
    const [useVoucher, setUseVoucher] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)
    const [provinceOptions, setProvinceOptions] = useState<
        { label: string; value: number }[]
    >([])
    const [wardOptions, setWardOptions] = useState<
        { label: string; value: number }[]
    >([])
    const [shippingFee, setShippingFee] = useState(0)
    const [isShippingFeeLoading, setIsShippingFeeLoading] = useState(false)

    const fullName = Form.useWatch("fullName", form)
    const phone = Form.useWatch("phone", form)
    const email = Form.useWatch("email", form)
    const selectedCity = Form.useWatch('city', form)
    const selectedWard = Form.useWatch('ward', form)
    const address = Form.useWatch('address', form)

    const items: ICartItem[] = checkedOutItems ?? []
    const itemCount = useMemo(
        () =>
            items.reduce(
                (sum: number, item: ICartItem) => sum + item.quantity,
                0,
            ),
        [items],
    )
    const subtotal = useMemo(
        () =>
            items.reduce((sum: number, item: ICartItem) => {
                const effectivePrice = getEffectivePrice(
                    item.quantity,
                    item.priceTiers,
                    item.price,
                )
                return sum + effectivePrice * item.quantity
            }, 0),
        [items],
    )
    const selectedCityName = useMemo(() => {
        const option = provinceOptions.find(
            (item) => item.value === selectedCity,
        )
        return option?.label?.toString() || ""
    }, [provinceOptions, selectedCity])

    const selectedWardName = useMemo(() => {
        const option = wardOptions.find(
            (item) => item.value === selectedWard,
        )
        return option?.label?.toString() || ""
    }, [wardOptions, selectedWard])
    const discount = useVoucher ? Math.min(50000, subtotal) : 0
    const total = Math.max(subtotal + shippingFee - discount, 0)

    const [debouncedAddress, setDebouncedAddress] = useState("")

    // 2. Effect debounce riêng cho address
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedAddress((address || "").trim())
        }, 1000) // 1s

        return () => clearTimeout(handler)
    }, [address])

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return
        if (typeof window === "undefined") return

        const token = sessionStorage.getItem(CHECKOUT_FLOW_KEY)
        if (!token) {
            router.replace(routes.gioHang.url)
            return
        }

        const issuedAt = Number(token)
        if (!issuedAt || Date.now() - issuedAt > CHECKOUT_FLOW_TTL_MS) {
            sessionStorage.removeItem(CHECKOUT_FLOW_KEY)
            router.replace(routes.gioHang.url)
        }
    }, [isHydrated, router])

    useEffect(() => {
        if (!isHydrated) return
        if (items.length === 0) {
            showMessage.warning("Vui lòng chọn sản phẩm để thanh toán.")
            router.replace(routes.gioHang.url)
        }
    }, [isHydrated, items, router])

    useEffect(() => {
        if (!loadingAuth && !isAuthenticated) {
            router.push(routes.dangNhap.url)
        }
    }, [loadingAuth, isAuthenticated, router])

    useEffect(() => {
        form.setFieldsValue({
            fullName: user?.fullName,
            phone: user?.phone,
            email: user?.email,
            paymentMethod: "cod",
            city: user?.address?.provinceCode,
            ward: user?.address?.wardCode,
            address: user?.address?.detail,
        })
    }, [form, user])

    useEffect(() => {
        form.resetFields(['ward']);
    }, [selectedCity]);

    useEffect(() => {
        getProvinces().then((res) => {
            setProvinceOptions(
                res.map((i: Province) => ({
                    label: i.name,
                    value: i.code,
                })),
            )
        })
    }, [])

    useEffect(() => {
        if (selectedCity !== null && selectedCity !== undefined) {
            getProvinces(selectedCity, 2).then((res) => {
                setWardOptions(
                    res.wards.map((i: Ward) => ({
                        label: i.name,
                        value: i.code,
                    })),
                )
            })
        }
    }, [selectedCity])

    useEffect(() => {
        if (!isHydrated) return

        const province = selectedCityName.trim()
        const district = selectedWardName.trim()
        const ward = selectedWardName.trim()
        const detailAddress = debouncedAddress

        if (!province || !district || !ward || !detailAddress || subtotal <= 0) {
            setShippingFee(0)
            return
        }

        let isActive = true
        setIsShippingFeeLoading(true)

        fetchAPI("/shipping-fee", {
            method: "POST",
            body: JSON.stringify({
                province,
                district,
                ward,
                address: detailAddress,
                subtotal,
            }),
        })
            .then((res) => {
                const fee = Number(res?.data?.fee ?? 0)
                if (isActive) {
                    setShippingFee(Number.isFinite(fee) ? fee : 0)
                }
            })
            .catch(() => {
                if (isActive) {
                    setShippingFee(0)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsShippingFeeLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [
        isHydrated,
        selectedCityName,
        selectedWardName,
        debouncedAddress,
        subtotal,
    ])

    const handleSubmit = async (values: any) => {
        if (items.length === 0) {
            showMessage.warning("Giỏ hàng đang trống.")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await fetchAPI("/orders", {
                method: "POST",
                body: JSON.stringify({
                    customerInfo: {
                        name: values.fullName,
                        phone: values.phone,
                        email: values.email,
                    },
                    shippingAddress: {
                        province: selectedCity,
                        ward: selectedWard,
                        address: values.address,
                    },
                    paymentMethod: values.paymentMethod,
                    note: values.note,
                    selectedProductIds: items.map((item) => item.productId),
                }),
            })

            const createdOrderId =
                result?.data?._id || result?.data?.id || ""
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            showMessage.success("Đặt hàng thành công.")
            if (createdOrderId) {
                router.push(`/dat-hang/thanh-cong?orderId=${createdOrderId}`)
            } else {
                router.push(routes.trangCaNhan.url)
            }
        } catch (error: any) {
            showMessage.error(
                error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loadingAuth) {
        return <Loading className="!mt-20" />
    }

    return (
        <div className="w-full max-w-[620px] mx-auto !mt-6 !mb-20">
            <Card
                className="shadow-md border border-gray-100 overflow-hidden"
                styles={{ body: { padding: 0 } }}
            >
                <div className="bg-[var(--primary)] text-white text-lg text-center py-4 font-semibold">
                    Địa chỉ nhận hàng
                </div>
                <div className="mt-2 p-6 space-y-5 bg-[linear-gradient(180deg,_#ffffff_0%,_#f6f8ff_100%)]">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Row gutter={14}>
                            <Col span={12}>
                                <Form.Item
                                    name="fullName"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập họ và tên.",
                                        },
                                    ]}
                                >
                                    <FloatingInput required label="Họ và tên" placeholder="Nguyễn Văn A" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="phone"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập số điện thoại.",
                                        },
                                    ]}
                                >
                                    <FloatingInput required label="Số điện thoại" placeholder="0909 054 504" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={14}>
                            <Col span={12}>
                                <Form.Item
                                    name="city"
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: v('required', {
                                                field: t('auth.city'),
                                            }),
                                        },
                                    ]}
                                >
                                    <FloatingSelect
                                        required
                                        label={t('auth.city')}
                                        placeholder={t('form.select', {
                                            field: t('auth.city'),
                                        })}
                                        options={provinceOptions}
                                        showSearch={{
                                            optionFilterProp: ['label'],
                                        }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="ward"
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: v('required', {
                                                field: t('auth.ward'),
                                            }),
                                        },
                                    ]}
                                >
                                    <FloatingSelect
                                        disabled={!selectedCity}
                                        required
                                        label={t('auth.ward')}
                                        placeholder={t('form.select', {
                                            field: t('auth.ward'),
                                        })}
                                        options={wardOptions}
                                        showSearch={{
                                            optionFilterProp: ['label'],
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <Form.Item
                                    required
                                    name="address"
                                    rules={[
                                        {
                                            required: true,
                                            message: v('required', {
                                                field: t('auth.detailAddress'),
                                            }),
                                        },
                                    ]}
                                >
                                    <FloatingTextArea
                                        disabled={!selectedWard}
                                        required
                                        label={t('auth.detailAddress')}
                                        placeholder={t('form.enter', {
                                            field: t('auth.detailAddress'),
                                        })}
                                        size="large"
                                        className="!w-full"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="rounded-lg border border-gray-200 overflow-hidden mb-7">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                                <Text type="secondary">Tiền hàng</Text>
                                <Text>{formatPrice(subtotal)}</Text>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                                <Text type="secondary">Phí vận chuyển</Text>
                                <Text>
                                    {isShippingFeeLoading
                                        ? "Đang tính..."
                                        : formatPrice(shippingFee)}
                                </Text>
                            </div>
                            {/* <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                                <Checkbox
                                    checked={useVoucher}
                                    onChange={(e) =>
                                        setUseVoucher(e.target.checked)
                                    }
                                >
                                    Sử dụng khuyến mãi
                                </Checkbox>
                                <Text className="text-red-500">
                                    -{formatPrice(discount)}
                                </Text>
                            </div> */}
                            <div className="flex items-center justify-between px-4 py-2">
                                <Text strong>Tổng tiền</Text>
                                <Text strong className="text-red-600 text-lg">
                                    {formatPrice(total)}
                                </Text>
                            </div>
                        </div>

                        <Form.Item
                            name="note"
                        >
                            <FloatingTextArea
                                label="Ghi chú đơn hàng"
                                rows={3}
                                placeholder="Lưu ý khi giao hàng..."
                            />
                        </Form.Item>

                        <Divider className="!my-3" />

                        <Form.Item
                            label="Phương thức thanh toán"
                            name="paymentMethod"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Vui lòng chọn phương thức thanh toán.",
                                },
                            ]}
                        >
                            <Radio.Group className="flex flex-wrap gap-4">
                                <Radio value="cod">Thanh toán khi nhận hàng</Radio>
                                <Radio value="bank">Chuyển khoản ngân hàng</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Button
                            type="primary"
                            size="large"
                            block
                            className="!h-[44px]"
                            htmlType="submit"
                            loading={isSubmitting || isShippingFeeLoading}
                            disabled={items.length === 0 || isShippingFeeLoading || isSubmitting}
                        >
                            Mua hàng
                        </Button>
                    </Form>
                </div>
            </Card >
        </div >
    )
}
