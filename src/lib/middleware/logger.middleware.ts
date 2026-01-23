import { NextRequest } from "next/server";

export function logger(request: NextRequest) {
    const start = Date.now();
    const { method, url } = request;

    console.log(`[${new Date().toISOString()}] ${method} ${url}`);

    // You can also log response time after handler executes
    // This is a simplified version
    return null;
}