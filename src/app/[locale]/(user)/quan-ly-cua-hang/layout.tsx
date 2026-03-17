import React from "react"
import BoothLayoutClient from "./layout-client"

export default function BoothLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <BoothLayoutClient>{children}</BoothLayoutClient>
}
