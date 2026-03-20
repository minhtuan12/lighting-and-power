const DEFAULT_GHTK_BASE_URL = 'https://services.giaohangtietkiem.vn'
const DEFAULT_GHTK_FEE_ENDPOINT = '/services/shipment/fee'
const DEFAULT_GHTK_WEIGHT = 500
const GHTK_SHOP_PROVINCE = 'TP. Hồ Chí Minh'
const GHTK_SHOP_DISTRICT = 'Phường Lái Thiêu'

function getEnvValue(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]
        if (value) {
            return value
        }
    }

    return undefined
}

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

export interface GhtkShippingFeePayload {
    province: string
    district: string
    ward?: string
    address: string
    subtotal: number
    weight?: number
}

export function getGhtkConfig() {
    const apiKey = getEnvValue(
        'GHTK_API_KEY',
        'GHTK_TOKEN',
        'GIAOHANGTIETKIEM_API_KEY',
    )
    const pickProvince = GHTK_SHOP_PROVINCE
    const pickDistrict = GHTK_SHOP_DISTRICT
    const baseUrl = trimTrailingSlash(
        getEnvValue('GHTK_API_URL') || DEFAULT_GHTK_BASE_URL,
    )
    const feeEndpoint =
        getEnvValue('GHTK_FEE_ENDPOINT') || DEFAULT_GHTK_FEE_ENDPOINT
    const defaultWeight = Number(
        getEnvValue('GHTK_DEFAULT_WEIGHT', 'GHTK_WEIGHT') ||
        DEFAULT_GHTK_WEIGHT,
    )

    if (!apiKey) {
        throw new Error('Missing GHTK API key configuration')
    }

    if (!pickProvince || !pickDistrict) {
        throw new Error('Missing GHTK pickup address configuration')
    }

    return {
        apiKey,
        pickProvince,
        pickDistrict,
        baseUrl,
        feeEndpoint,
        defaultWeight: Number.isFinite(defaultWeight)
            ? defaultWeight
            : DEFAULT_GHTK_WEIGHT,
    }
}

export async function getGhtkShippingFee(payload: GhtkShippingFeePayload) {
    const config = getGhtkConfig()
    const params = new URLSearchParams({
        address: payload.address,
        province: payload.province,
        district: payload.district,
        pick_province: config.pickProvince,
        pick_district: config.pickDistrict,
        weight: String(payload.weight ?? config.defaultWeight),
        value: String(payload.subtotal),
    })

    if (payload.ward) {
        params.set('ward', payload.ward)
    }

    const encodedParams = params.toString().replace(/\+/g, '%20')
    const url = `${config.baseUrl}${config.feeEndpoint}?${encodedParams}`
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Token: config.apiKey,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            data?.message || 'Failed to fetch shipping fee from GHTK',
        )
    }

    if (!data?.success) {
        throw new Error(
            data?.message || 'GHTK shipping fee lookup was unsuccessful',
        )
    }

    return {
        fee: Number(data?.fee?.fee || 0),
        raw: data,
    }
}
