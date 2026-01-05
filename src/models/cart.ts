import mongoose, { Schema } from 'mongoose';

const CartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantSku: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productSlug: {
        type: String,
        required: true,
        trim: true
    },
    productImage: {
        type: String,
        trim: true
    },
    variantName: {
        type: String,
        trim: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    availableStock: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: true });

const CartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true // Mỗi user chỉ có 1 cart
        },
        items: {
            type: [CartItemSchema],
            default: []
        },
        totalItems: {
            type: Number,
            default: 0,
            min: 0
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },
        lastModified: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });
CartSchema.index({ lastModified: -1 });

// Pre-save middleware to calculate totals
CartSchema.pre('save', function() {
    // Calculate total items
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update last modified
    this.lastModified = new Date();
});

// Virtual for user info
CartSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

export default Cart;