"use client"

import { Button, Flex } from "antd"
import { useSetAtom } from "jotai"
import { loginModalAtom, authModalTabAtom } from "@/stores/ui"

export default function HeaderAuthButtons({
    registerText,
    loginText,
}: {
    registerText: string
    loginText: string
}) {
    const setLoginModal = useSetAtom(loginModalAtom)
    const setActiveTab = useSetAtom(authModalTabAtom)

    return (
        <Flex gap={35}>
            <Button
                onClick={() => {
                    setActiveTab('register')
                    setLoginModal(true)
                }}
                className="!bg-[var(--brand-btn-bg)] hover:!bg-[var(--brand-btn-hover)] !rounded-[10px] !border-none !text-white transition-colors"
            >
                {registerText}
            </Button>
            <Button
                onClick={() => {
                    setActiveTab('login')
                    setLoginModal(true)
                }}
                className="!bg-[var(--brand-btn-bg)] hover:!bg-[var(--brand-btn-hover)] !rounded-[10px] !border-none !text-white transition-colors"
            >
                {loginText}
            </Button>
        </Flex>
    )
}
