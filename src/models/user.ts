import { EUserRole, IUser } from '@/types/user';
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
            unique: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Invalid email format'
            }
        },
        phone: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        role: {
            type: String,
            enum: Object.values(EUserRole),
            default: EUserRole.user
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now
        },
        passwordExpiresAt: {
            type: Date,
            default: function () {
                // Mặc định hết hạn sau 6 tháng (180 ngày)
                const sixMonths = new Date();
                sixMonths.setMonth(sixMonths.getMonth() + 6);
                return sixMonths;
            }
        },
        mustChangePassword: {
            type: Boolean,
            default: false
        },
        passwordHistory: {
            type: [String],
            default: [],
            select: false // Không select mặc định vì lý do bảo mật
        },
    },
    {
        timestamps: true
    }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ passwordExpiresAt: 1 });

// Virtual: Kiểm tra password có hết hạn không
UserSchema.virtual('isPasswordExpired').get(function () {
    if (!this.passwordExpiresAt) return false;
    return new Date() > this.passwordExpiresAt;
});

// Virtual: Số ngày còn lại trước khi password hết hạn
UserSchema.virtual('daysUntilPasswordExpires').get(function () {
    if (!this.passwordExpiresAt) return null;
    const now = new Date();
    const expires = this.passwordExpiresAt;
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Method: Kiểm tra password có cần đổi không
UserSchema.methods.needsPasswordChange = function (): boolean {
    if (this.mustChangePassword) return true;
    if (!this.passwordExpiresAt) return false;
    return new Date() > this.passwordExpiresAt;
};

// Method: Kiểm tra password sắp hết hạn (còn < 7 ngày)
UserSchema.methods.isPasswordExpiringSoon = function (): boolean {
    if (!this.passwordExpiresAt) return false;
    const now = new Date();
    const daysLeft = Math.ceil((this.passwordExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
