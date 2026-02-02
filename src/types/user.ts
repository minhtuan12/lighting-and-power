export enum EUserRole {
    admin = 'admin',
    user = 'user'
}

export interface IAddress {
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
}

export interface IUser {
    _id: string;
    avatar?: string;
    email?: string;
    phone?: string;
    fullName: string;
    password: string;
    role: "admin" | "user";
    passwordChangedAt?: Date;
    passwordExpiresAt?: Date;
    mustChangePassword: boolean;
    passwordHistory: string[];
    address: IAddress | null;
    createdAt: Date;
    updatedAt: Date;
}
