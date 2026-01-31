'use client'

import { routes } from '@/constants/routes';
import { showMessage } from '@/hooks/use-message';
import { useRegister } from '@/hooks/user/use-register';
import { Button, Form, Input } from 'antd';
import { Lock, Mail, Phone, RefreshCcwDot, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
    const t = useTranslations();
    const v = useTranslations('validation');
    const router = useRouter();
    const { registerAsync, isRegistering } = useRegister();
    const [form] = Form.useForm();

    const handleSubmit = async (values: any) => {
        try {
            const result = await registerAsync({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                phone: values.phone,
            });

            showMessage.success(t('auth.registerSuccess'));
            router.push(routes.dangNhap.url);
        } catch (error: any) {
            showMessage.error(error?.message || t('auth.registerFailed'));
        }
    };

    return (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
                name="fullName"
                label={t('auth.fullName')}
                rules={[{ required: true, message: v('required', { field: t('auth.fullName') }) }]}
            >
                <Input placeholder={t('form.enter', { field: t('auth.fullName') })} size="large" prefix={<User />} />
            </Form.Item>

            <Form.Item
                name="email"
                label={t('auth.email')}
                rules={[
                    { type: 'email', message: v('invalid', { field: t('auth.email') }) },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const phone = getFieldValue('phone');
                            if (!value && !phone) {
                                return Promise.reject(new Error(v('requiredOne', { field: t('auth.email'), field2: t('auth.phone') })));
                            }
                            return Promise.resolve();
                        },
                    }),
                ]}
            >
                <Input placeholder={t('form.enter', { field: t('auth.email') })} size="large" prefix={<Mail />} />
            </Form.Item>

            <Form.Item
                name="phone"
                label={t('auth.phone')}
                rules={[
                    {
                        pattern: /^[0-9]{10,11}$/,
                        message: v('invalid', { field: t('auth.phone') })
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const email = getFieldValue('email');
                            if (!value && !email) {
                                return Promise.reject(new Error(v('requiredOne', { field: t('auth.email'), field2: t('auth.phone') })));
                            }
                            return Promise.resolve();
                        },
                    }),
                ]}
            >
                <Input placeholder={t('form.enter', { field: t('auth.phone') })} size="large" prefix={<Phone />} />
            </Form.Item>

            <Form.Item
                name="password"
                label={t('auth.password')}
                rules={[
                    { required: true, message: v('required', { field: t('auth.password') }) },
                    { min: 6, message: v('min', { field: t('auth.password'), min: 6 }) },
                    {
                        pattern: /[A-Z]/,
                        message: v('uppercasePassword')
                    },
                    {
                        pattern: /[a-z]/,
                        message: v('lowercasePassword')
                    },
                    {
                        pattern: /[0-9]/,
                        message: v('oneDigitPassword')
                    },
                    {
                        pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                        message: v('specialCharacterPassword')
                    }
                ]}
            >
                <Input.Password placeholder={t('form.enter', { field: t('auth.password') })} size="large" prefix={<Lock />} />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                label={t('auth.confirmPassword')}
                dependencies={['password']}
                rules={[
                    { required: true, message: v('passwordNotMatch') },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error(v('passwordNotMatch')));
                        },
                    }),
                ]}
            >
                <Input.Password placeholder={t('auth.confirmPassword')} size="large" prefix={<RefreshCcwDot />} />
            </Form.Item>

            <Button
                type="primary"
                htmlType="submit"
                loading={isRegistering}
                block
            >
                {t('auth.register')}
            </Button>
        </Form >
    );
}
