import { PAGE_LIMIT } from '@/constants/common';
import User from '@/models/user';
import { EUserRole } from '@/types/user';

export class UserService {
    static async getAccounts(
        page: number = 1,
        search?: string
    ) {
        const skip = (page - 1) * PAGE_LIMIT;
        const filter: any = {
            role: EUserRole.user,
        };

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .skip(skip)
                .limit(PAGE_LIMIT)
                .lean(),

            User.countDocuments(filter),
        ]);

        return {
            data: users,
            pagination: {
                page,
                total,
                totalPages: Math.ceil(total / PAGE_LIMIT),
            },
        };
    }


    static async getProfile(userId: string) {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isActive === false) {
            throw new Error('Account inactive');
        }

        return user;
    }

    static async updateProfile(userId: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Update only provided fields
        if (data.name) user.name = data.name;
        if (data.email) user.email = data.email;
        if (data.phone) user.phone = data.phone;
        if (data.avatar) user.avatar = data.avatar;

        await user.save();

        const { password: _, ...safeUser } = user.toObject();
        return safeUser;
    }
}
