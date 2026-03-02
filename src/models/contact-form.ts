import { EContactStatus, IContactForm } from "@/types/contact-form"
import mongoose, { Schema } from "mongoose"

const ContactFormSchema = new Schema<IContactForm>(
	{
		fullName: {
			type: String,
			required: [true, "Full name is required"],
			trim: true,
		},
		emailOrPhone: {
			type: String,
			required: [true, "Email or phone number is required"],
			trim: true,
			validate: {
				validator: function (v: string) {
					const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
					const isPhone = /^[0-9]{9,15}$/.test(v)
					return isEmail || isPhone
				},
				message: "Must be a valid email address or phone number",
			},
		},
		subject: {
			type: String,
			required: [true, "Subject is required"],
			trim: true,
			maxlength: [200, "Subject cannot exceed 200 characters"],
		},
		content: {
			type: String,
			required: [true, "Content is required"],
			trim: true,
			maxlength: [2000, "Content cannot exceed 2000 characters"],
		},
		status: {
			type: String,
			enum: Object.values(EContactStatus),
			default: EContactStatus.pending,
		},
	},
	{
		timestamps: true,
	},
)

// Indexes
ContactFormSchema.index({ status: 1 })
ContactFormSchema.index({ createdAt: -1 })

const ContactForm =
	mongoose.models.ContactForm ||
	mongoose.model<IContactForm>("ContactForm", ContactFormSchema)

export default ContactForm
