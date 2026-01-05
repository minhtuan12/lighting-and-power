import Cart from '@/models/cart';
import Product from '@/models/product';
import { ICart, ICartItem } from '@/types/cart';

export class CartService {

    // ================= GET CART =================

    static async getCart(userId: string) {
        let cart = await Cart.findOne({ userId }).lean();

        // Tạo cart mới nếu chưa có
        if (!cart) {
            cart = await Cart.create({
                userId,
                items: [],
                totalItems: 0,
                subtotal: 0
            });
        }

        // Validate stock cho tất cả items
        const validatedCart = await this.validateCartStock(cart);

        return validatedCart;
    }

    // ================= ADD TO CART =================

    static async addItem(userId: string, data: {
        productId: string;
        variantSku?: string;
        quantity: number;
    }) {
        // Validate product exists
        const product = await Product.findById(data.productId);
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.status !== 'active') {
            throw new Error('Product is not available');
        }

        // Get price and stock info
        let price = product.price;
        let variantName: string | undefined;
        let availableStock = product.stock;
        let productImage = product.thumbnail || product.images[0];

        // Check stock availability
        if (availableStock < data.quantity) {
            throw new Error(`Only ${availableStock} items available in stock`);
        }

        // Check min order quantity
        if (product.minOrderQuantity && data.quantity < product.minOrderQuantity) {
            throw new Error(`Minimum order quantity is ${product.minOrderQuantity}`);
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex((item: ICartItem) =>
            item.productId.toString() === data.productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + data.quantity;

            if (newQuantity > availableStock) {
                throw new Error(`Cannot add more. Only ${availableStock} items available`);
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = price; // Update price
            cart.items[existingItemIndex].availableStock = availableStock;
            cart.items[existingItemIndex].inStock = availableStock > 0;
        } else {
            // Add new item
            cart.items.push({
                productId: data.productId,
                variantSku: data.variantSku,
                quantity: data.quantity,
                price,
                productName: product.name,
                productSlug: product.slug,
                productImage,
                variantName,
                inStock: availableStock > 0,
                availableStock
            } as ICartItem);
        }

        await cart.save();

        return cart;
    }

    // ================= UPDATE CART ITEM =================

    static async updateItemQuantity(
        userId: string,
        itemId: string,
        quantity: number
    ) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        const item = cart.items.find((i: ICartItem) => i._id?.toString() === itemId);
        if (!item) {
            throw new Error('Item not found in cart');
        }

        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        // Check stock
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error('Product not found');
        }

        let availableStock = product.stock;
        if (quantity > availableStock) {
            throw new Error(`Only ${availableStock} items available`);
        }

        // Check min order quantity
        if (product.minOrderQuantity && quantity < product.minOrderQuantity) {
            throw new Error(`Minimum order quantity is ${product.minOrderQuantity}`);
        }

        // Update quantity
        item.quantity = quantity;
        item.availableStock = availableStock;
        item.inStock = availableStock > 0;

        await cart.save();

        return cart;
    }

    // ================= REMOVE ITEM =================

    static async removeItem(userId: string, itemId: string) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        const itemIndex = cart.items.findIndex((i: ICartItem) => i._id?.toString() === itemId);
        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        return cart;
    }

    // ================= CLEAR CART =================

    static async clearCart(userId: string) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        cart.items = [];
        await cart.save();

        return cart;
    }

    // ================= VALIDATE STOCK =================

    static async validateCartStock(cart: ICart) {
        const validatedItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.productId);

            if (!product || product.status !== 'active') {
                // Product không tồn tại hoặc không active
                validatedItems.push({
                    ...item,
                    inStock: false,
                    availableStock: 0,
                    error: 'Product is no longer available'
                });
                continue;
            }

            let availableStock = product.stock;
            let currentPrice = product.price;

            // Check stock
            const inStock = availableStock >= item.quantity;
            const priceChanged = currentPrice !== item.price;

            validatedItems.push({
                ...item,
                inStock,
                availableStock,
                price: currentPrice,
                priceChanged,
                oldPrice: priceChanged ? item.price : undefined,
                error: !inStock ? `Only ${availableStock} items available` : undefined
            });
        }

        return {
            ...cart,
            items: validatedItems
        };
    }

    // ================= SYNC CART =================

    static async syncCart(userId: string) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        const updatedItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.productId);

            if (!product || product.status !== 'active') {
                // Skip unavailable products
                continue;
            }

            let availableStock = product.stock;
            let currentPrice = product.price;
            let productImage = product.thumbnail || product.images[0];

            // Adjust quantity if exceeds stock
            const quantity = Math.min(item.quantity, availableStock);

            if (quantity > 0) {
                updatedItems.push({
                    ...item,
                    quantity,
                    price: currentPrice,
                    productName: product.name,
                    productSlug: product.slug,
                    productImage,
                    inStock: availableStock >= quantity,
                    availableStock
                } as ICartItem);
            }
        }

        cart.items = updatedItems;
        await cart.save();

        return cart;
    }

    // ================= BULK OPERATIONS =================

    static async addMultipleItems(userId: string, items: Array<{
        productId: string;
        variantSku?: string;
        quantity: number;
    }>) {
        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        for (const item of items) {
            try {
                await this.addItem(userId, item);
            } catch (error) {
                console.error(`Failed to add item ${item.productId}:`, error);
                // Continue with other items
            }
        }

        // Reload cart
        cart = await Cart.findOne({ userId }).lean();
        return cart;
    }

    static async removeMultipleItems(userId: string, itemIds: string[]) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        cart.items = cart.items.filter((item: ICartItem) =>
            !itemIds.includes(item._id?.toString() || '')
        );

        await cart.save();

        return cart;
    }

    // ================= STATISTICS =================

    static async getCartStats(userId: string) {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return {
                totalItems: 0,
                totalProducts: 0,
                subtotal: 0,
                isEmpty: true
            };
        }

        const validated = await this.validateCartStock(cart);
        const outOfStockCount = validated.items.filter((item: any) => !item.inStock).length;

        return {
            totalItems: cart.totalItems,
            totalProducts: cart.items.length,
            subtotal: cart.subtotal,
            isEmpty: cart.items.length === 0,
            hasOutOfStock: outOfStockCount > 0,
            outOfStockCount
        };
    }

    // ================= MERGE CART (for login) =================

    static async mergeCarts(userId: string, guestCartItems: ICartItem[]) {
        // Get user's existing cart
        let userCart = await Cart.findOne({ userId });
        if (!userCart) {
            userCart = new Cart({ userId, items: [] });
        }

        // Merge guest cart items
        for (const guestItem of guestCartItems) {
            const existingIndex = userCart.items.findIndex((item: ICartItem) =>
                item.productId.toString() === guestItem.productId.toString()
            );

            if (existingIndex > -1) {
                // Merge quantities
                userCart.items[existingIndex].quantity += guestItem.quantity;
            } else {
                // Add new item
                userCart.items.push(guestItem);
            }
        }

        await userCart.save();

        // Sync to update prices and stock
        return await this.syncCart(userId);
    }
}