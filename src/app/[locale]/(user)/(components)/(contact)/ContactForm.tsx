'use client'

import { showMessage } from "@/hooks/use-message"
import { useContact } from "@/hooks/user/use-contact"
import { Button, Col, Divider, Flex, Form, Input, Row } from "antd"
import { useTranslations } from "next-intl"

function ContactFormContent() {
	const t = useTranslations()
	const v = useTranslations("validation")
	const { sendContactAsync, isSending } = useContact()
	const [form] = Form.useForm()

	const handleSubmit = async (values: {
		fullName: string
		emailOrPhone: string
		subject: string
		content: string
	}) => {
		try {
			await sendContactAsync(values)
			showMessage.success(t("form.sendContactSuccess"))
			form.resetFields()
		} catch (error: any) {
			showMessage.error(error?.message || t("form.sendFailed"))
		}
	}

	return <Flex vertical gap={10}>
		<h3 className="text-center font-semibold text-xl">
			{t("contactUs.contact")}
			<Divider />
		</h3>
		<Form form={form} onFinish={handleSubmit} layout="vertical" className="!-mt-3">
			<Row gutter={20}>
				<Col span={12}>
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
							disabled={isSending}
							className="!h-11"
							placeholder={t("form.enter", {
								field: t("auth.fullName"),
							})}
							size="large"
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
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
							disabled={isSending}
							className="!h-11"
							placeholder={t("form.enter", {
								field: t("auth.emailOrPhone"),
							})}
							size="large"
						/>
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="subject"
				required
				label={
					<div className="text-base font-semibold">
						{t("contactUs.subject")}
					</div>
				}
				rules={[
					{
						required: true,
						message: v("required", {
							field: t("contactUs.subject"),
						}),
					},
				]}
			>
				<Input
					disabled={isSending}
					className="!h-11"
					placeholder={t("form.enter", {
						field: t("contactUs.subject"),
					})}
					size="large"
				/>
			</Form.Item>

			<Form.Item
				name="content"
				required
				label={
					<div className="text-base font-semibold">
						{t("contactUs.content")}
					</div>
				}
				rules={[
					{
						required: true,
						message: v("required", {
							field: t("contactUs.content"),
						}),
					},
				]}
			>
				<Input.TextArea
					disabled={isSending}
					placeholder={t("form.enter", {
						field: t("contactUs.content"),
					})}
					size="large"
				/>
			</Form.Item>

			<Button
				size="large"
				type="primary"
				htmlType="submit"
				loading={isSending}
				block
				className="!h-12 mt-2"
			>
				{t("form.send")}
			</Button>
		</Form>
	</Flex>
}

export default function ContactForm() {
	return <ContactFormContent />
}
