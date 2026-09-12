import { PAGE_LIMIT } from "@/constants/common"
import Friendship from "@/models/friendship"
import User from "@/models/user"
import { EUserRole, IAddress } from "@/types/user"

export class UserService {
    static async getAccounts(page: number = 1, search?: string) {
        const skip = (page - 1) * PAGE_LIMIT
        const filter: any = {
            role: EUserRole.user,
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ]
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .skip(skip)
                .limit(PAGE_LIMIT)
                .lean(),

            User.countDocuments(filter),
        ])

        return {
            data: users,
            pagination: {
                page,
                total,
                totalPages: Math.ceil(total / PAGE_LIMIT),
            },
        }
    }

    static async getProfile(userId: string) {
        const user = await User.findById(userId).select("-password")

        if (!user) {
            throw new Error("User not found")
        }

        return user
    }

    static async getUserByInfo(
        emailOrPhoneOrUsername: string,
        exceptId?: string,
    ) {
        let conds: any = {
            $or: [
                { email: emailOrPhoneOrUsername },
                { phone: emailOrPhoneOrUsername },
                { username: emailOrPhoneOrUsername },
            ],
        }
        if (exceptId) {
            conds = {
                ...conds,
                _id: { $ne: exceptId },
            }
        }
        const user = await User.findOne(conds)
        return user
    }

    static async updateProfile(
        userId: string,
        data: {
            fullName?: string
            email?: string
            phone?: string
            avatar?: string
            username?: string
            address?: IAddress
        },
    ) {
        const user = await User.findById(userId)

        if (!user) {
            throw new Error("User not found")
        }

        // Update only provided fields
        if (data.fullName) user.name = data.fullName
        if (data.email) user.email = data.email
        if (data.phone) user.phone = data.phone
        if (data.avatar) user.avatar = data.avatar
        if (data.username) user.username = data.username
        if (data.address) user.address = data.address

        await user.save()

        const { password: _, ...safeUser } = user.toObject()
        return safeUser
    }

    static async searchUsers(
        query: string,
        currentUserId?: string,
        limit: number = 10
    ) {
        console.log(currentUserId)
        const term = query.trim()
        if (!term) return []

        const regex = { $regex: term, $options: "i" }

        const users = await User.find({
            $or: [
                { fullName: regex },
                { username: regex },
                { email: regex },
                { phone: regex },
            ],
            ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
        })
            .select("fullName avatar username role")
            .limit(limit)
            .lean()

        if (!currentUserId || users.length === 0) {
            return users.map((u) => ({ ...u, isFriend: false }))
        }

        const userIds = users.map((u) => u._id)
        const friendRows = await Friendship.find({
            status: "accepted",
            $or: [
                { requesterId: currentUserId, addresseeId: { $in: userIds } },
                { addresseeId: currentUserId, requesterId: { $in: userIds } },
            ],
        }).lean()

        const friendIds = new Set(
            friendRows.map((row) =>
                String(row.requesterId) === String(currentUserId)
                    ? String(row.addresseeId)
                    : String(row.requesterId),
            ),
        )

        return users.map((u) => ({
            ...u,
            isFriend: friendIds.has(String(u._id)),
        }))
    }
}
