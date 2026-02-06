"use client";

import JotaiProvider from "@/app/[locale]/(providers)/jotai-provider";
import QueryProvider from "@/app/[locale]/(providers)/query-provider";
import { useLogout } from "@/hooks/use-me";
import { IUser } from "@/types/user";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex } from "antd";
import { MenuProps } from "antd/lib";
import { ChevronDown, LogOut } from "lucide-react";
import { Suspense } from "react";
import Loading from "../Loading";

function UserMenuContent({ user }: { user: IUser }) {
    const { logoutAsync } = useLogout();
    const items: MenuProps["items"] = [
        {
            key: "1",
            label: "asd",
        },
        {
            key: "2",
            label: "zxczxc",
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
                    Đăng xuất
                </Flex>
            ),
        },
    ];

    return (
        <Suspense fallback={<Loading size="small" />}>
            <Dropdown menu={{ items }} trigger={["click"]}>
                <Flex align="center" gap={5}>
                    <Avatar
                        size="large"
                        src={user?.avatar}
                        icon={<UserOutlined />}
                    />
                    <ChevronDown />
                </Flex>
            </Dropdown>
        </Suspense>
    );
}

export default function UserMenu({ user }: { user: IUser }) {
    return (
        <JotaiProvider>
            <QueryProvider>
                <UserMenuContent user={user} />
            </QueryProvider>
        </JotaiProvider>
    );
}
