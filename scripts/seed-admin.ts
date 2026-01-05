import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '@/models/user';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const ADMIN_DATA = {
    name: 'Admin',
    email: 'admin@example.com',
    phone: '+84900000000',
    password: 'Admin@123',
    role: 'admin' as const
};
const FORCE_RESET = true;

async function seedAdmin() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: ADMIN_DATA.email },
                { phone: ADMIN_DATA.phone }
            ]
        });

        if (existingAdmin && !FORCE_RESET) {
            console.log('⚠️  Admin account already exists:');
            console.log('   Email:', existingAdmin.email);
            console.log('   Phone:', existingAdmin.phone);
            console.log('   Role:', existingAdmin.role);
            console.log('\n💡 Set FORCE_RESET = true to reset admin account');
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);

        if (existingAdmin) {
            // Reset existing admin
            console.log('🔄 Resetting existing admin account...');

            existingAdmin.name = ADMIN_DATA.name;
            existingAdmin.email = ADMIN_DATA.email;
            existingAdmin.phone = ADMIN_DATA.phone;
            existingAdmin.password = hashedPassword;
            existingAdmin.role = ADMIN_DATA.role;

            await existingAdmin.save();

            console.log('\n✅ Admin account reset successfully!');
        } else {
            // Create new admin
            console.log('👤 Creating admin account...');

            await User.create({
                fullName: ADMIN_DATA.name,
                email: ADMIN_DATA.email,
                phone: ADMIN_DATA.phone,
                password: hashedPassword,
                role: ADMIN_DATA.role,
            });

            console.log('\n✅ Admin account created successfully!');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', ADMIN_DATA.email);
        console.log('📱 Phone:', ADMIN_DATA.phone);
        console.log('🔑 Password:', ADMIN_DATA.password);
        console.log('👑 Role:', ADMIN_DATA.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        throw error;
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the seed function
seedAdmin()
    .then(() => {
        console.log('\n✅ Seed completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    });