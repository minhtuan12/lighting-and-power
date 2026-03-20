import { getGhtkShippingFee } from '@/lib/ghtk'
import { NextRequest, NextResponse } from 'next/server'

interface ShippingFeeRequestBody {
    province?: string
    district?: string
    ward?: string
    address?: string
    subtotal?: number
    weight?: number
}

function normalizeString(value?: string) {
    return value?.trim() || ''
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ShippingFeeRequestBody
        const province = normalizeString(body.province)
        const district = normalizeString(body.district)
        const ward = normalizeString(body.ward)
        const address = normalizeString(body.address)
        const subtotal = Number(body.subtotal)
        const weight =
            body.weight !== undefined ? Number(body.weight) : undefined

        if (!province || !district || !ward || !address) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Province, district, ward, and address are required',
                },
                { status: 400 },
            )
        }

        if (!Number.isFinite(subtotal) || subtotal < 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Subtotal must be a valid non-negative number',
                },
                { status: 400 },
            )
        }

        if (weight !== undefined && (!Number.isFinite(weight) || weight <= 0)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Weight must be a valid positive number',
                },
                { status: 400 },
            )
        }

        const shippingFee = await getGhtkShippingFee({
            province,
            district,
            ward,
            address,
            subtotal,
            weight,
        })

        return NextResponse.json({
            success: true,
            data: shippingFee,
        })
    } catch (error: any) {
        console.error('Get shipping fee error:', error)

        return NextResponse.json(
            {
                success: false,
                message: error?.message || 'Failed to get shipping fee',
            },
            { status: 500 },
        )
    }
}
