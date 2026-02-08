"use client"

import JotaiProvider from "@/app/[locale]/(providers)/jotai-provider"
import QueryProvider from "@/app/[locale]/(providers)/query-provider"
import { routes } from "@/constants/routes"
import { useLogout } from "@/hooks/use-me"
import { IUser } from "@/types/user"
import { UserOutlined } from "@ant-design/icons"
import { Avatar, Dropdown, Flex } from "antd"
import { MenuProps } from "antd/lib"
import { ChevronDown, LogOut, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Suspense } from "react"
import Loading from "../Loading"

function UserMenuContent({ user }: { user: IUser }) {
    const t = useTranslations();
    const { logoutAsync } = useLogout()
    const items: MenuProps["items"] = [
        {
            key: "profile",
            label: <Link href={routes.trangCaNhan.url} className="flex gap-1 !text-black">
                <User size={16} />
                {t('common.profile')}
            </Link>,
        },
        {
            key: "logout",
            label: (
                <Flex
                    gap={5}
                    align="center"
                    className="!cursor-pointer"
                    onClick={() => logoutAsync()}
                >
                    <LogOut size={16} />
                    {t('common.logout')}
                </Flex>
            ),
        },
    ]

    return (
        <Suspense fallback={<Loading size="small" />}>
            <Dropdown menu={{ items }} trigger={["click"]}>
                <Flex align="center" gap={2} className="cursor-pointer">
                    <Avatar
                        size="large"
                        src={user?.avatar}
                        icon={<UserOutlined />}
                    />
                    <ChevronDown size={18} />
                </Flex>
            </Dropdown>
        </Suspense>
    )
}

export default function UserMenu({ user }: { user: IUser }) {
    return (
        <JotaiProvider>
            <QueryProvider>
                <UserMenuContent user={user} />
            </QueryProvider>
        </JotaiProvider>
    )
}
