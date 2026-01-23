import Config from '@/models/config';
import { IConfig } from '@/types/config';

export class ConfigService {

    // ============ GET CONFIG ============

    static async getConfig() {
        let config = await Config.findOne().lean();

        // Create default config if not exists
        if (!config) {
            config = await this.createDefaultConfig();
        }

        return config;
    }

    static async getPublicConfig() {
        const config = await this.getConfig();

        // Return only public fields (exclude sensitive data)
        return {
            companyName: config.companyName,
            hotline: config.hotline,
            email: config.email,
            address: config.address,
            workingHours: config.workingHours,
            social: config.social,
        };
    }

    // ============ UPDATE CONFIG ============

    static async updateConfig(data: Partial<IConfig>) {
        let config = await Config.findOne();

        if (!config) {
            config = await this.createDefaultConfig();
        }

        // Update fields
        Object.keys(data).forEach(key => {
            if (data[key as keyof IConfig] !== undefined) {
                (config as any)[key] = data[key as keyof IConfig];
            }
        });

        await config.save();
        return config;
    }

    static async updateSection(section: string, data: any) {
        let config = await Config.findOne();

        if (!config) {
            config = await this.createDefaultConfig();
        }

        (config as any)[section] = {
            ...(config as any)[section],
            ...data
        };

        await config.save();
        return config;
    }

    // ============ HELPERS ============

    private static async createDefaultConfig() {
        const config = await Config.create({
            companyName: 'Tiệm Điện Tử L&P',
            hotline: '0853 887 855',
            email: 'thanhphuvsvccd2@gmail.com',
            address: '2/4A Tổ 10, KP.Bình Thuận, P.Lái Thiêu, TP.Hồ Chí Minh',
            workingHours: '8:00 - 22:00 (Hàng ngày)',
        });

        return config.toObject();
    }
}
