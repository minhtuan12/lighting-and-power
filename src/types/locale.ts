export const localeConfig = {
    vi: {
        code: "vi-VN",
        currency: "VND",
        currencyLabel: "VND - Việt Nam Đồng",
        currencySymbol: "₫",
        label: "Tiếng Việt",
        flag: "VI",
    },
    en: {
        code: "en-US",
        currency: "USD",
        currencyLabel: "USD - US Dollar",
        currencySymbol: "$",
        label: "English",
        flag: "EN",
    },
} as const

export type Locale = keyof typeof localeConfig
