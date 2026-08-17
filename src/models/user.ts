import { EUserRole, IUser } from "@/types/user"
import mongoose, { Schema } from "mongoose"

const AddressSchema = new Schema(
    {
        provinceCode: {
            type: Number,
            required: [true, "Province/City is required"],
            trim: true,
        },
        wardCode: {
            type: Number,
            required: [true, "Ward is required"],
            trim: true,
        },
        detail: {
            type: String,
            required: [true, "Street address is required"],
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: false,
        timestamps: false,
    },
)

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                },
                message: "Invalid email format",
            },
        },
        phone: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: Object.values(EUserRole),
            default: EUserRole.user,
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now,
        },
        passwordExpiresAt: {
            type: Date,
            default: function () {
                // Mặc định hết hạn sau 12 tháng (360 ngày)
                const twelveMonths = new Date()
                twelveMonths.setMonth(twelveMonths.getMonth() + 12)
                return twelveMonths
            },
        },
        mustChangePassword: {
            type: Boolean,
            default: false,
        },
        passwordHistory: {
            type: [String],
            default: [],
            select: false, // Không select mặc định vì lý do bảo mật
        },
        address: {
            type: AddressSchema,
            default: null,
        },
    },
    {
        timestamps: true,
    },
)

// Indexes
UserSchema.index({ passwordExpiresAt: 1 })
UserSchema.index({ "addresses.isDefault": 1 })
UserSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            email: { $type: "string", $gt: "" },
        },
    },
)
// Partial Unique Index: Phone unique chỉ khi có giá trị (không null/undefined)
UserSchema.index(
    { phone: 1 },
    {
        unique: true,
        partialFilterExpression: {
            phone: { $type: "string", $gt: "" },
        },
    },
)

// Virtual: Kiểm tra password có hết hạn không
UserSchema.virtual("isPasswordExpired").get(function () {
    if (!this.passwordExpiresAt) return false
    return new Date() > this.passwordExpiresAt
})

// Virtual: Số ngày còn lại trước khi password hết hạn
UserSchema.virtual("daysUntilPasswordExpires").get(function () {
    if (!this.passwordExpiresAt) return null
    const now = new Date()
    const expires = this.passwordExpiresAt
    const diffTime = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
})

// Method: Kiểm tra password có cần đổi không
UserSchema.methods.needsPasswordChange = function (): boolean {
    if (this.mustChangePassword) return true
    if (!this.passwordExpiresAt) return false
    return new Date() > this.passwordExpiresAt
}

// Method: Kiểm tra password sắp hết hạn (còn < 7 ngày)
UserSchema.methods.isPasswordExpiringSoon = function (): boolean {
    if (!this.passwordExpiresAt) return false
    const now = new Date()
    const daysLeft = Math.ceil(
        (this.passwordExpiresAt.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    )
    return daysLeft > 0 && daysLeft <= 7
}

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
