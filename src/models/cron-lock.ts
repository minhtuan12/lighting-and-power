import mongoose, { Schema } from "mongoose"

const CronLockSchema = new Schema({
	_id: { type: String, required: true }, // tên job, vd "expire-payos-orders"
	lockedUntil: { type: Date, required: true },
})

const CronLock =
	mongoose.models.CronLock || mongoose.model("CronLock", CronLockSchema)

export default CronLock

/**
 * Cố gắng giành lock cho 1 lần chạy job. Trả về true nếu giành được.
 * TTL của lock = duration (ms), tự hết hạn nếu process crash giữa chừng.
 */
export async function acquireCronLock(jobName: string, durationMs: number) {
	const now = new Date()
	const result = await CronLock.findOneAndUpdate(
		{
			_id: jobName,
			$or: [{ lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }],
		},
		{ $set: { lockedUntil: new Date(now.getTime() + durationMs) } },
		{ upsert: true, new: false }, // new:false -> nếu vừa upsert (chưa từng có), trả null -> coi là giành được
	).catch((err) => {
		// Trường hợp race upsert trùng _id (E11000) -> có process khác vừa tạo -> không giành được
		if (err?.code === 11000) return "CONFLICT"
		throw err
	})

	if (result === "CONFLICT") return false
	return true // null (chưa từng có, vừa tạo) hoặc doc cũ đã hết hạn -> đều coi là giành được
}
