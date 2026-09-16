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
import { CloseCircleFilled } from "@ant-design/icons"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Card, Col, Divider, Form, Radio, Row, Typography } from "antd"
import { useAtom } from "jotai"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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

// Thêm hằng số idempotency key riêng cho mỗi lần vào trang checkout
function useClientRequestId() {
    const ref = useRef<string>('');
    if (!ref.current) {
        ref.current =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`
    }
    return ref.current
}

export default function OrderCheckoutPage() {
    const t = useTranslations()
    const v = useTranslations('validation')
    const router = useRouter()
    const searchParams = useSearchParams()
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
    const clientRequestId = useClientRequestId()
    const [payosState, setPayosState] = useState<{
        orderId: string
        checkoutUrl: string
    } | null>(null)
    const [verifyingPayment, setVerifyingPayment] = useState(false)
    const [ordered, setOrdered] = useState<any>(null);
    const [cancelReturnState, setCancelReturnState] = useState<{
        orderId: string
        orderCode: string | null
        loading: boolean
        error: boolean
    } | null>(null)
    const cancelReturn = searchParams.get("cancel") === "true" && Boolean(searchParams.get("orderId"))
    const cancelOrderId = searchParams.get("orderId")
    const cancelOrderCode = searchParams.get("orderCode")

    useEffect(() => {
        if (!isAuthenticated || !cancelReturn || !cancelOrderId) return

        let active = true
        setCancelReturnState({
            orderId: cancelOrderId,
            orderCode: cancelOrderCode,
            loading: true,
            error: false,
        })

        fetchAPI(`/orders/${cancelOrderId}/payment-cancelled`, {
            method: "POST",
        })
            .then(async () => {
                // The callback can be opened more than once; read the final order
                // so an already-cancelled order still gets a useful result page.
                try {
                    await fetchAPI(`/orders/${cancelOrderId}`)
                } catch {
                    // The cancellation request above is the source of truth.
                }
                if (active) {
                    setCancelReturnState((current) => current ? { ...current, loading: false } : current)
                    queryClient.invalidateQueries({ queryKey: ["orders"] })
                }
            })
            .catch(() => {
                if (active) {
                    setCancelReturnState((current) => current ? { ...current, loading: false, error: true } : current)
                }
            })

        return () => {
            active = false
        }
    }, [cancelOrderCode, cancelOrderId, cancelReturn, isAuthenticated, queryClient])

    // Sau khi tạo đơn thành công với paymentMethod = 'payos'
    const openPayosDialog = useCallback((order: any) => {
        if (!order?.payment?.checkoutUrl) return
        setOrdered(order)
        setPayosState({ orderId: order._id, checkoutUrl: order.payment.checkoutUrl })
    }, [])

    const pollOrderStatus = useCallback(async (orderId: string) => {
        setVerifyingPayment(true)
        const start = Date.now()
        const TIMEOUT_MS = 30_000

        const check = async (): Promise<void> => {
            const res = await fetchAPI(`/orders/${orderId}`)
            if (res?.data?.paymentStatus === "paid") {
                setVerifyingPayment(false)
                router.push(`/dat-hang/thanh-cong?orderId=${orderId}`)
                return
            }
            if (Date.now() - start > TIMEOUT_MS) {
                setVerifyingPayment(false)
                showMessage.warning(
                    "Đang chờ xác nhận thanh toán, vui lòng kiểm tra lại trong trang đơn hàng.",
                )
                router.push(routes.trangCaNhan.url)
                return
            }
            setTimeout(check, 2000)
        }
        check()
    }, [router])

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
                        // GHTK expects the address names, matching the values
                        // used by the shipping-fee preview request.
                        province: selectedCityName,
                        ward: selectedWardName,
                        address: values.address,
                    },
                    paymentMethod: values.paymentMethod, // "cod" | "payos"
                    note: values.note,
                    selectedProductIds: items.map((item) => item.productId),
                    clientRequestId,
                }),
            })

            const order = result?.data

            if (values.paymentMethod === "payos") {
                // Mở dialog thanh toán ngay tại trang này, không redirect
                if (!order?.payment?.checkoutUrl) {
                    throw new Error("Không tìm thấy đường dẫn thanh toán PayOS.")
                }
                window.location.assign(order.payment.checkoutUrl)
                return
            }

            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            showMessage.success("Đặt hàng thành công.")
            router.push(`/dat-hang/thanh-cong?orderId=${order._id || order.id}`)
        } catch (error: any) {
            showMessage.error(error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.")
        } finally {
            setIsSubmitting(false)
        }
    }

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
        if (cancelReturn) return
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
    }, [cancelReturn, isHydrated, router])

    useEffect(() => {
        if (!isHydrated) return
        if (cancelReturn) return
        if (items.length === 0) {
            showMessage.warning("Vui lòng chọn sản phẩm để thanh toán.")
            router.replace(routes.gioHang.url)
        }
    }, [cancelReturn, isHydrated, items, router])

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

    if (loadingAuth) {
        return <Loading className="!mt-20" />
    }

    if (cancelReturn) {
        if (!cancelReturnState || cancelReturnState.loading) {
            return <Loading className="!mt-20" />
        }

        return (
            <div className="w-full max-w-[620px] mx-auto !mt-10 !mb-20 px-4">
                <Card className="overflow-hidden border border-red-100 shadow-md" styles={{ body: { padding: 0 } }}>
                    <div className="bg-[var(--primary)] px-6 py-8 text-center text-white">
                        <CloseCircleFilled className="mb-3 text-5xl text-red-200" />
                        <h1 className="m-0 text-2xl font-semibold">Giao dịch đã bị hủy</h1>
                        <p className="mb-0 mt-2 text-white/85">Giao dịch chưa hoàn tất. Đơn hàng vẫn được giữ lại để bạn có thể thanh toán sau.</p>
                    </div>
                    <div className="space-y-4 bg-[linear-gradient(180deg,_#ffffff_0%,_#f6f8ff_100%)] p-6 text-center">
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left">
                            <div className="flex justify-between gap-4">
                                <Text type="secondary">Mã đơn hàng</Text>
                                <Text strong>{cancelReturnState.orderCode || cancelReturnState.orderId}</Text>
                            </div>
                            <div className="mt-2 flex justify-between gap-4">
                                <Text type="secondary">Trạng thái</Text>
                                <Text className="text-amber-600">Đang xử lý · Chờ thanh toán</Text>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button className="!h-[40px]" type="primary" block onClick={() => router.push(routes.trangCaNhan.url)}>
                                Xem đơn hàng của tôi
                            </Button>
                            <Button className="!h-[40px]" block onClick={() => router.push(routes.gioHang.url)}>
                                Quay lại giỏ hàng
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        )
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
                                <Radio value="payos">Chuyển khoản ngân hàng</Radio>
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
            </Card>
            <div id="payos-embedded-container" style={{ marginTop: 16 }} />
            {verifyingPayment && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-9 flex flex-col items-center gap-4 max-w-[340px] w-full">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)]/15" />
                            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
                        </div>
                        <Text strong className="text-center text-base">
                            Đang xác nhận thanh toán...
                        </Text>
                        <Text type="secondary" className="text-center text-sm !mt-0">
                            Vui lòng đợi trong giây lát, không đóng hoặc tải lại trang.
                        </Text>
                    </div>
                </div>
            )}
        </div>
    )
}
