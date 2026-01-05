import User from '@/models/user';
import { EUserRole, IUser } from '@/types/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {

    // ================= PASSWORD POLICY CONFIG =================
    private static readonly PASSWORD_EXPIRY_MONTHS = 6;
    private static readonly PASSWORD_HISTORY_COUNT = 5; // Lưu 5 mật khẩu gần nhất
    private static readonly PASSWORD_MIN_LENGTH = 8;

    // ================= AUTH =================

    static async register(data: {
        fullName: string;
        email?: string;
        phone?: string;
        password: string;
    }) {
        // Validate password strength
        this.validatePasswordStrength(data.password);

        // Check if email already exists
        if (data.email) {
            const existingEmail = await User.findOne({ email: data.email });
            if (existingEmail) {
                throw new Error('Email already exists');
            }
        }

        // Check if phone already exists
        if (data.phone) {
            const existingPhone = await User.findOne({ phone: data.phone });
            if (existingPhone) {
                throw new Error('Phone already exists');
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Set password expiry date (6 months from now)
        const passwordExpiresAt = new Date();
        passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + this.PASSWORD_EXPIRY_MONTHS);

        // Create user
        const user = await User.create({
            fullName: data.fullName,
            email: data.email || null,
            phone: data.phone || null,
            password: hashedPassword,
            role: EUserRole.user,
            passwordChangedAt: new Date(),
            passwordExpiresAt,
            passwordHistory: [hashedPassword],
            mustChangePassword: false
        });

        // Remove sensitive fields from response
        const { password: _, role: __, passwordHistory: ___, ...safeAccount } = user.toObject();

        return { account: safeAccount };
    }

    static async login(emailOrPhone: string, password: string) {
        const account = await User.findOne({
            $or: [
                { email: emailOrPhone },
                { phone: emailOrPhone }
            ]
        });

        if (!account) throw new Error('Account not found');

        const isValid = await bcrypt.compare(password, account.password);
        if (!isValid) throw new Error('Invalid credentials');

        // Check if password expired
        if (account.role === EUserRole.user && account.needsPasswordChange()) {
            return {
                requirePasswordChange: true,
                message: 'Your password has expired. Please change your password.',
                userId: account._id
            };
        }

        // Check if password expiring soon (warn user)
        const passwordExpiringSoon = account.isPasswordExpiringSoon();
        const daysLeft = account.daysUntilPasswordExpires;

        const accessToken = this.generateAccessToken(account);
        const refreshToken = this.generateRefreshToken(account);

        const { password: _, passwordHistory: __, ...safeAccount } = account.toObject();

        return {
            account: safeAccount,
            accessToken,
            refreshToken,
            passwordWarning: passwordExpiringSoon ? {
                message: `Mật khẩu của bạn sẽ hết hạn trong ${daysLeft} ngày tới. Vui lòng đổi mật khẩu.`,
                daysLeft
            } : null
        };
    }

    static async changePassword(
        userId: string,
        oldPassword: string,
        newPassword: string
    ) {
        const user = await User.findById(userId).select('+passwordHistory');
        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password strength
        this.validatePasswordStrength(newPassword);

        // Check if new password is same as old password
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            throw new Error('New password cannot be the same as current password');
        }

        // Check if password was used before (check history)
        if (user.passwordHistory && user.passwordHistory.length > 0) {
            for (const oldHash of user.passwordHistory) {
                const wasUsedBefore = await bcrypt.compare(newPassword, oldHash);
                if (wasUsedBefore) {
                    throw new Error(`This password was used recently. Please choose a different password.`);
                }
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password history (keep last 5)
        const passwordHistory = user.passwordHistory || [];
        passwordHistory.unshift(hashedPassword);
        if (passwordHistory.length > this.PASSWORD_HISTORY_COUNT) {
            passwordHistory.pop();
        }

        // Set new expiry date (6 months from now)
        const passwordExpiresAt = new Date();
        passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + this.PASSWORD_EXPIRY_MONTHS);

        // Update user
        user.password = hashedPassword;
        user.passwordChangedAt = new Date();
        user.passwordExpiresAt = passwordExpiresAt;
        user.mustChangePassword = false;
        user.passwordHistory = passwordHistory;

        await user.save();

        return {
            success: true,
            message: 'Password changed successfully',
            passwordExpiresAt
        };
    }

    static async forcePasswordChange(userId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.mustChangePassword = true;
        await user.save();

        return {
            success: true,
            message: 'User must change password on next login'
        };
    }

    static async resetPassword(
        userId: string,
        newPassword: string
    ) {
        const user = await User.findById(userId).select('+passwordHistory');
        if (!user) {
            throw new Error('User not found');
        }

        // Validate new password strength
        this.validatePasswordStrength(newPassword);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password history
        const passwordHistory = user.passwordHistory || [];
        passwordHistory.unshift(hashedPassword);
        if (passwordHistory.length > this.PASSWORD_HISTORY_COUNT) {
            passwordHistory.pop();
        }

        // Set new expiry date
        const passwordExpiresAt = new Date();
        passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + this.PASSWORD_EXPIRY_MONTHS);

        // Update user and force password change on next login
        user.password = hashedPassword;
        user.passwordChangedAt = new Date();
        user.passwordExpiresAt = passwordExpiresAt;
        user.mustChangePassword = true; // Bắt đổi password lần đầu đăng nhập
        user.passwordHistory = passwordHistory;

        await user.save();

        return {
            success: true,
            message: 'Password reset successfully. User must change password on next login.'
        };
    }

    static async refreshToken(token: string) {
        const decoded = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET!
        ) as any;

        const account = await User.findById(decoded.id);
        if (!account) {
            throw new Error('Invalid refresh token');
        }

        // Check if password expired
        if (account.needsPasswordChange()) {
            throw new Error('Password expired. Please change your password.');
        }

        return this.generateAccessToken(account);
    }

    // ================= PASSWORD VALIDATION =================

    private static validatePasswordStrength(password: string) {
        if (password.length < this.PASSWORD_MIN_LENGTH) {
            throw new Error(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
        }

        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        // Check for at least one number
        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }
    }

    // ================= HELPERS =================

    private static generateAccessToken(user: IUser) {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '7d' }
        );
    }

    private static generateRefreshToken(user: IUser) {
        return jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '7d' }
        );
    }

    // ================= ADMIN UTILITIES =================

    static async getExpiredPasswordUsers() {
        const users = await User.find({
            passwordExpiresAt: { $lt: new Date() }
        }).select('fullName email phone passwordExpiresAt');

        return users;
    }

    static async getExpiringSoonUsers(days: number = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const users = await User.find({
            passwordExpiresAt: {
                $gt: new Date(),
                $lt: futureDate
            }
        }).select('fullName email phone passwordExpiresAt');

        return users;
    }
}