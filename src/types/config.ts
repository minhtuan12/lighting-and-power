export interface IConfig {
    companyName: string;
    hotline: string;
    email: string;
    address: string;
    workingHours?: string;
    social: {
        facebook?: string;
        youtube?: string;
        tiktok?: string;
        zalo?: string;
        telegram?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
