export enum EUserRole {
    admin = 'admin',
    user = 'user'
}

export interface IUser {
    _id: string;
    email?: string;
    phone?: string;
    fullName: string;
    password: string;
    role: "admin" | "user";
    passwordChangedAt?: Date;
    passwordExpiresAt?: Date;
    mustChangePassword: boolean;
    passwordHistory: string[];
    createdAt: Date;
    updatedAt: Date;
}
