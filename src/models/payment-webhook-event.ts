import mongoose, { Schema } from 'mongoose'

const PaymentWebhookEventSchema = new Schema(
	{
		// reference = mã giao dịch ngân hàng, duy nhất theo từng lần chuyển tiền thực tế
		reference: { type: String, required: true, unique: true },
		orderCode: Number,
		paymentLinkId: String,
		rawPayload: Schema.Types.Mixed,
	},
	{ timestamps: true },
)

export default mongoose.models.PaymentWebhookEvent ||
	mongoose.model('PaymentWebhookEvent', PaymentWebhookEventSchema)
