"use client"

import { usePathname, useRouter } from "@/i18n/routing"
import { safeLocalStorage } from "@/lib/utils"
import { localeConfig } from "@/types/locale"
import { Button, Dropdown, Flex, Select, Space } from "antd"
import { MenuProps } from "antd/lib"
import { ChevronDown, Globe } from "lucide-react"
import {
    createFormatter,
    useFormatter,
    useLocale,
    useTranslations,
} from "next-intl"
import { useCallback, useEffect, useMemo, useState } from "react"

const VI = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
    >
        <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#c93728"
        ></rect>
        <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
        ></path>
        <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
        ></path>
        <path
            fill="#ff5"
            d="M18.008 16.366L21.257 14.006 17.241 14.006 16 10.186 14.759 14.006 10.743 14.006 13.992 16.366 12.751 20.186 16 17.825 19.249 20.186 18.008 16.366z"
        ></path>
    </svg>
)
const EN = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
    >
        <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#fff"
        ></rect>
        <path
            fill="#be2a2a"
            d="M31 14L18 14 18 4 14 4 14 14 1 14 1 18 14 18 14 28 18 28 18 18 31 18 31 14z"
        ></path>
        <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
        ></path>
        <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
        ></path>
    </svg>
)

const languages = [
    { value: "vi", label: "Tiếng Việt", icon: VI },
    { value: "en", label: "English", icon: EN },
]

const currencies = [
    { value: "VND", label: "VND (₫)" },
    { value: "USD", label: "USD ($)" },
]

export default function LanguageCurrencySwitcher() {
    const locale = useLocale()
    const t = useTranslations("common")
    const router = useRouter()
    const format = useFormatter()
    const pathname = usePathname()
    const formatters = useMemo(() => createFormatter({ locale }), [locale])
    const [lang, setLang] = useState(locale)
    const [currency, setCurrency] = useState("VND")
    const currentLocale = localeConfig[locale as keyof typeof localeConfig]

    const handleApply = useCallback(() => {
        safeLocalStorage.setItem("locale", lang)
        safeLocalStorage.setItem("currency", currency)
        router.replace(pathname, { locale: lang })
    }, [lang, currency, pathname, router])

    const items: MenuProps["items"] = [
        {
            key: "1",
            label: (
                <Flex vertical gap={2} onClick={(e) => e.stopPropagation()}>
                    <label className="text-black font-semibold">
                        {t("language")}
                    </label>
                    <Select
                        className="!w-full !px-2 !text-sm"
                        rootClassName="relative z-[9999]"
                        value={lang}
                        onChange={setLang}
                        options={languages}
                        style={{ width: 150 }}
                        size="large"
                    />
                </Flex>
            ),
            disabled: true,
        },
        {
            key: "2",
            label: (
                <Flex vertical gap={2} onClick={(e) => e.stopPropagation()}>
                    <label className="text-black font-semibold">
                        {t("currency")}
                    </label>
                    <Select
                        className="!w-full !px-2 !text-sm"
                        rootClassName="relative z-[9999]"
                        options={Object.values(localeConfig).map((c) => ({
                            label: c.currencyLabel,
                            value: c.currency,
                        }))}
                        onChange={setCurrency}
                        value={currency}
                        style={{ width: 150 }}
                        size="large"
                    />
                </Flex>
            ),
            disabled: true,
        },
        {
            key: "3",
            label: (
                <div onClick={(e) => e.stopPropagation()}>
                    <Button
                        className="rounded-full w-full"
                        type="primary"
                        onClick={handleApply}
                    >
                        {t("apply")}
                    </Button>
                </div>
            ),
            disabled: true,
        },
    ]

    useEffect(() => {
        const savedCurrency = safeLocalStorage.getItem("currency")
        if (savedCurrency) {
            setCurrency(savedCurrency)
        }
    }, [setCurrency])

    return (
        <Dropdown menu={{ items }} trigger={["click"]}>
            <a
                onClick={(e) => e.preventDefault()}
                className="!text-black !-mb-1 font-semibold"
            >
                <Space style={{ gap: 2, marginBottom: -4 }}>
                    <Globe />
                    <span>
                        {currentLocale?.label} - {currentLocale?.currency}
                    </span>
                    <ChevronDown size={16} />
                </Space>
            </a>
        </Dropdown>
    )
}
