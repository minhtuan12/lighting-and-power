'use client'

import { useAuth } from "@/hooks/use-me";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex } from "antd";
import { MenuProps } from "antd/lib";
import { ChevronDown } from "lucide-react";
import Loading from "../Loading";

export default function UserMenu() {
    const { isLoading, user, logoutAsync } = useAuth();
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: 'asd',
        },
        {
            key: '2',
            label: 'zxczxc',
        },
        {
            key: '3',
            label: '1weqwe',
        },
    ];

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Dropdown menu={{ items }} trigger={['click']}>
            <Flex align="center" gap={5}>
                <Avatar size="large" src={user?.avatar} icon={<UserOutlined />} />
                <ChevronDown />
            </Flex>
        </Dropdown>
    );
}
