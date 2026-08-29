'use client'

import {
    FloatingInput,
    FloatingSelect,
    FloatingTextArea,
} from '@/components/inputs/FloatingInputs'
import Loading from '@/components/Loading'
import { useMe, useUpdateProfile } from '@/hooks/use-me'
import useUpload from '@/hooks/use-upload'
import { getProvinces } from '@/lib/utils'
import { Province, Ward } from '@/types/general'
import {
    Avatar,
    Button,
    Col,
    Flex,
    Form,
    Row,
    Space,
    Switch,
    Upload,
} from 'antd'
import { Pencil, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

export default function Info() {
    const t = useTranslations()
    const v = useTranslations('validation')
    const { user, isLoading } = useMe()
    const { isUploadingImage, uploadImagesToCloudinary } = useUpload()
    const {
        isLoading: isUpdating,
        updateProfileAsync,
    } = useUpdateProfile()
    const [form] = Form.useForm()

    const [provinceOptions, setProvinceOptions] = useState([])
    const [wardOptions, setWardOptions] = useState([])
    const [isDefaultAddress, setIsDefaultAddress] = useState(
        Boolean(user?.address?.isDefault),
    )
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageFilePreview, setImageFilePreview] = useState<string>('')

    const selectedCity = Form.useWatch('city', form)
    const selectedWard = Form.useWatch('ward', form)

    const handleSubmit = useCallback(
        async (values: any) => {
            let uploadedImageUrl: string = ''
            if (imageFile && typeof imageFile !== 'string') {
                uploadedImageUrl = await uploadImagesToCloudinary(imageFile)
            }
            updateProfileAsync({
                avatar: (uploadedImageUrl || user?.avatar) || undefined,
                username: values.username ?? undefined,
                address: {
                    provinceCode: values.city,
                    wardCode: values.ward,
                    detail: values.detailAddress,
                    isDefault: isDefaultAddress,
                },
                email: values.email ?? undefined,
                fullName: values.fullName,
                phone: values.phone ?? undefined,
            })
        },
        [isDefaultAddress, imageFile],
    )

    const handleImageSelect = useCallback(
        (file: File) => {
            setImageFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImageFilePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        },
        [imageFile, imageFilePreview],
    )

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
        if (user) {
            form.setFieldsValue({
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                city: user.address?.provinceCode,
                ward: user.address?.wardCode,
                detailAddress: user.address?.detail,
                isDefault: Boolean(user.address?.isDefault),
            })
            setIsDefaultAddress(Boolean(user.address?.isDefault))
        }
    }, [user])

    if (isLoading) {
        return <Loading size="large" />
    }

    return (
        <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
        >
            <Row className="mb-10 flex justify-center">
                <Upload
                    maxCount={1}
                    beforeUpload={(file) => {
                        handleImageSelect(file)
                        return false
                    }}
                    accept="image/*"
                    className="cursor-pointer"
                    rootClassName="!w-25 !h-25"
                    itemRender={() => null}
                >
                    <div className="rounded-full cursor-pointer relative border border-gray-200 w-fit h-fit">
                        <Avatar
                            size={100}
                            icon={<UserRound size={50} />}
                            src={imageFilePreview || user?.avatar}
                        />
                        <Space className="rounded-full bg-white w-6 h-6 border-2 border-gray-200 flex items-center justify-center absolute bottom-2 right-0">
                            <Pencil size={12} />
                        </Space>
                    </div>
                </Upload>
            </Row>
            <Row gutter={30}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="fullName"
                        required
                        rules={[
                            {
                                required: true,
                                message: v('required', {
                                    field: t('auth.fullName'),
                                }),
                            },
                        ]}
                    >
                        <FloatingInput
                            required
                            label={t('auth.fullName')}
                            className="!h-11"
                            placeholder={t('form.enter', {
                                field: t('auth.fullName'),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="username">
                        <FloatingInput
                            label={t('auth.username')}
                            className="!h-11"
                            placeholder={t('form.enter', {
                                field: t('auth.username'),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="email">
                        <FloatingInput
                            disabled={!!user?.email}
                            type={'email'}
                            label={t('auth.email')}
                            className="!h-11"
                            placeholder={t('form.enter', {
                                field: t('auth.email'),
                            })}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="phone">
                        <FloatingInput
                            disabled={!!user?.phone}
                            label={t('auth.phone')}
                            className="!h-11"
                            placeholder={t('form.enter', {
                                field: t('auth.phone'),
                            })}
                            size="large"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
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

                    <Form.Item
                        required
                        name="detailAddress"
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
                        />
                    </Form.Item>

                    <Flex justify="end">
                        {t('profile.setAddressDefault')}
                        <Switch
                            className="!ml-5"
                            value={isDefaultAddress}
                            onChange={(e) => setIsDefaultAddress(e)}
                        />
                    </Flex>
                </Col>
            </Row>

            <Button
                size="large"
                type="primary"
                htmlType="submit"
                block
                className="space-x-2 mt-5"
                loading={isUpdating || isUploadingImage}
            >
                {t('form.ctaSave')}
            </Button>
        </Form>
    )
}
