import { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb"
import { atom } from "jotai"

export const breadcrumbAtom = atom<BreadcrumbItemType[]>([])

export const loginModalAtom = atom<boolean>(false)
export const authModalTabAtom = atom<'login' | 'register'>('login')
