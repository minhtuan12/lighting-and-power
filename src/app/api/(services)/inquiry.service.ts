import ContactForm from "@/models/contact-form"
import { EContactStatus } from "@/types/contact-form"

export const InquiryService = {
	getAll: async ({
		search = "",
		page = 1,
		limit = 10,
		status = "",
	}: {
		search?: string
		page?: number
		limit?: number
		status?: string
	}) => {
		const query: Record<string, any> = {}

		if (search) {
			query.$or = [
				{ fullName: { $regex: search, $options: "i" } },
				{ emailOrPhone: { $regex: search, $options: "i" } },
				{ subject: { $regex: search, $options: "i" } },
			]
		}

		if (status) {
			query.status = status
		}

		const skip = (page - 1) * limit

		const [inquiries, total] = await Promise.all([
			ContactForm.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			ContactForm.countDocuments(query),
		])

		return {
			inquiries,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		}
	},

	updateStatus: async (id: string, status: EContactStatus) => {
		return ContactForm.findByIdAndUpdate(
			id,
			{ status },
			{ new: true },
		).lean()
	},
}
