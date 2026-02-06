export enum EUserRole {
    admin = "admin",
    user = "user",
}

export interface IAddress {
    provinceCode: number
    wardCode: number
    detail: string
    isDefault: boolean
}

export interface IUser {
    _id: string
    username?: string
    avatar?: string
    email?: string
    phone?: string
    fullName: string
    password: string
    role: "admin" | "user"
    passwordChangedAt?: Date
    passwordExpiresAt?: Date
    mustChangePassword: boolean
    passwordHistory: string[]
    address: IAddress | null
    createdAt: Date
    updatedAt: Date
}
