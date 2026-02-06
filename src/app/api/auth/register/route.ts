import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "../../(services)/auth.service"

export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { username, fullName, email, phone, password } =
            await request.json()

        // Validate input
        if (!fullName || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Full name and password are required",
                },
                { status: 400 },
            )
        }

        if (!email && !phone) {
            return NextResponse.json(
                { success: false, message: "Email or phone is required" },
                { status: 400 },
            )
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return NextResponse.json(
                    { success: false, message: "Invalid email format" },
                    { status: 400 },
                )
            }
        }

        // Validate phone format if provided
        if (phone) {
            const phoneRegex = /^[0-9]{10,11}$/
            if (!phoneRegex.test(phone)) {
                return NextResponse.json(
                    { success: false, message: "Invalid phone number format" },
                    { status: 400 },
                )
            }
        }

        // Register via service
        const { account } = await AuthService.register({
            username,
            fullName,
            email,
            phone,
            password,
        })

        // Create response
        return NextResponse.json({
            success: true,
            message: "Registration successful",
            data: {
                ...account,
            },
        })
    } catch (error: any) {
        console.error("Register error:", error)

        // Handle specific errors
        if (error.message === "Email already exists") {
            return NextResponse.json(
                { success: false, message: "Email is already registered" },
                { status: 409 },
            )
        }

        if (error.message === "Phone already exists") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number is already registered",
                },
                { status: 409 },
            )
        }

        // Handle password validation errors
        if (error.message.includes("Password must")) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }

        // Generic error
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred, please try again later",
            },
            { status: 500 },
        )
    }
}
