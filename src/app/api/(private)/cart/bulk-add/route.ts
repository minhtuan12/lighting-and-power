async function bulkAddToCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, message: "Items array is required" },
                { status: 400 }
            );
        }

        const cart = await CartService.addMultipleItems(userId, items);

        return NextResponse.json({
            success: true,
            message: "Items added to cart",
            data: cart
        });

    } catch (error: any) {
        console.error('Bulk add to cart error:', error);

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    bulkAddToCart,
    connectDbMiddleware,
    verifyToken
);
