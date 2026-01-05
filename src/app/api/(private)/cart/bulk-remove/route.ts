async function bulkRemoveFromCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { itemIds } = body;

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json(
                { success: false, message: "Item IDs array is required" },
                { status: 400 }
            );
        }

        const cart = await CartService.removeMultipleItems(userId, itemIds);

        return NextResponse.json({
            success: true,
            message: "Items removed from cart",
            data: cart
        });

    } catch (error: any) {
        console.error('Bulk remove from cart error:', error);

        if (error.message === 'Cart not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

export const DELETE = withMiddleware(
    bulkRemoveFromCart,
    connectDbMiddleware,
    verifyToken
);
