'use client'

import { routes } from '@/constants/routes';
import { showMessage } from '@/hooks/use-message';
import { useRegister } from '@/hooks/user/use-register';
import { Button, Form, Input } from 'antd';
import { Lock, Mail, Phone, RefreshCcwDot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
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

            showMessage.success('Đăng ký thành công!');
            router.push(routes.dangNhap.url);
        } catch (error: any) {
            showMessage.error(error?.message || 'Đăng ký thất bại!');
        }
    };

    return (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
                <Input placeholder="Nhập họ và tên" size="large" prefix={<User />} />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { type: 'email', message: 'Email không hợp lệ!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const phone = getFieldValue('phone');
                            if (!value && !phone) {
                                return Promise.reject(new Error('Vui lòng nhập email hoặc số điện thoại!'));
                            }
                            return Promise.resolve();
                        },
                    }),
                ]}
            >
                <Input placeholder="Nhập email" size="large" prefix={<Mail />} />
            </Form.Item>

            <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                    {
                        pattern: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại phải có 10-11 số!'
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const email = getFieldValue('email');
                            if (!value && !email) {
                                return Promise.reject(new Error('Vui lòng nhập email hoặc số điện thoại!'));
                            }
                            return Promise.resolve();
                        },
                    }),
                ]}
            >
                <Input placeholder="Nhập số điện thoại" size="large" prefix={<Phone />} />
            </Form.Item>

            <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                    {
                        pattern: /[A-Z]/,
                        message: 'Mật khẩu phải có ít nhất 1 chữ hoa!'
                    },
                    {
                        pattern: /[a-z]/,
                        message: 'Mật khẩu phải có ít nhất 1 chữ thường!'
                    },
                    {
                        pattern: /[0-9]/,
                        message: 'Mật khẩu phải có ít nhất 1 số!'
                    },
                    {
                        pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                        message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt!'
                    }
                ]}
            >
                <Input.Password placeholder="Nhập mật khẩu" size="large" prefix={<Lock />} />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                        },
                    }),
                ]}
            >
                <Input.Password placeholder="Nhập lại mật khẩu" size="large" prefix={<RefreshCcwDot />} />
            </Form.Item>

            <Button
                type="primary"
                htmlType="submit"
                loading={isRegistering}
                block
            >
                Đăng ký
            </Button>
        </Form>
    );
}