export enum EContactStatus {
	pending = "pending",
	inProgress = "in_progress",
	resolved = "resolved",
}

export interface IContactForm {
	fullName: string
	emailOrPhone: string
	subject: string
	content: string
	status: EContactStatus
	createdAt: Date
	updatedAt: Date
}
