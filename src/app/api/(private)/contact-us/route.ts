import { withMiddleware } from "@/lib/api-handler"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import ContactForm from "@/models/contact-form"
import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

export async function contactUs(request: NextRequest): Promise<any> {
	try {
		const { fullName, emailOrPhone, subject, content } = await request.json()

		if (!subject || !content || !fullName || !emailOrPhone) {
			return NextResponse.json(
				{ success: false, message: 'Vui lòng điền đầy đủ thông tin' },
				{ status: 400 },
			)
		}

		const contact = await ContactForm.create({
			fullName: fullName!.trim(),
			emailOrPhone: emailOrPhone!.trim(),
			subject: subject!.trim(),
			content: content!.trim(),
		})

		return NextResponse.json(
			{
				success: true,
				message: "Your message has been sent. We will get back to you shortly.",
				data: {
					id: contact._id,
					fullName: contact.fullName,
					subject: contact.subject,
					status: contact.status,
					createdAt: contact.createdAt,
				},
			},
			{ status: 201 },
		)
	} catch (error: any) {
		console.error("[POST /api/contact", error)

		// Mongoose validation error
		if (error instanceof mongoose.Error.ValidationError) {
			const messages = Object.values(error.errors).map((e) => e.message)
			return NextResponse.json(
				{ success: false, message: messages[0] },
				{ status: 400 },
			)
		}

		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		)
	}
}

export const POST = withMiddleware(contactUs, connectDbMiddleware, verifyToken)
