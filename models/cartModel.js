const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        amount: {
            type: Number
        },
        quantity: {
            type: Number,
        },
        price: {
            type: Number
        },
        color: {
            type: String,
            required: true
        }
    }],
    appliedCoupon: {
        couponcode: {
            type: String,
            default: ''
        },
        discount: {
            type: Number,
            default: 0
        },
        discountAmount: {
            type: Number,
            default: 0
        }
    },
    totalPrice: {
        type: Number
    }
});

// Pre-save middleware to adjust totalPrice based on discount
// cartSchema.pre('save', function(next) {
//     if (this.appliedCoupon && this.appliedCoupon.discountAmount) {
//         this.totalPrice -= this.appliedCoupon.discountAmount;
//     }
//     next();
// });

module.exports = mongoose.model('Cart', cartSchema);
