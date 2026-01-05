import { IConfig } from '@/types/config';
import mongoose, { Schema } from 'mongoose';

const ConfigSchema = new Schema<IConfig>(
    {
        companyName: { type: String, required: true },
        hotline: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        workingHours: String,
        social: {
            facebook: String,
            youtube: String,
            tiktok: String,
            zalo: String,
            telegram: String,
        },
    },
    {
        timestamps: true
    }
);

// Only allow one config document
ConfigSchema.index({}, { unique: true });

const Config = mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);

export default Config;