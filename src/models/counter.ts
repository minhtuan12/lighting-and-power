import mongoose, { Schema } from 'mongoose'

const CounterSchema = new Schema({
	_id: { type: String, required: true },
	seq: { type: Number, default: 0 },
})

const Counter =
	mongoose.models.Counter || mongoose.model('Counter', CounterSchema)

export default Counter

export async function getNextSequence(name: string, session?: any) {
	const doc = await Counter.findByIdAndUpdate(
		name,
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true, session },
	)
	return doc!.seq as number
}

/**
 * Sinh mã orderCode dạng số nguyên, an toàn (< Number.MAX_SAFE_INTEGER),
 * duy nhất: yymmdd (6 số) + seq theo ngày (6 số) => tối đa 999,999 đơn/ngày.
 */
export async function generateOrderCode(session?: any): Promise<number> {
	const now = new Date()
	const datePart = [
		String(now.getFullYear()).slice(-2),
		String(now.getMonth() + 1).padStart(2, '0'),
		String(now.getDate()).padStart(2, '0'),
	].join('')
	const seq = await getNextSequence(`order_code_${datePart}`, session)
	return Number(`${datePart}${String(seq).padStart(6, '0')}`)
}
