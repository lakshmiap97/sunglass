const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    address:{
        name:{
            type:String,
        },
        mobile:{
            type:Number,
        },
        pincode:{
            type:Number,
        },
        locality:{
            type:String,
        },
        Address:{
            type:String,
        },
        city:{
            type:String,
        },
        state:{
            type:String, 
        },
        country:{
            type:String,
        }

    },
    products:[{
        product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
        },
        quantity:{
            type:Number,
            require:true
        },
        color:{
            type:String,
            required:true
        },
        amount:{
            type:Number,
            required:true
        }
    }],
    coupon:{
        type:String
    },
    discount:{
        type:Number
    },
    totalamount:{
        type:Number,
        required:true
    },
    paymentmethod:{
        type:String,
        required:true,
        enum: ['razorpay', 'cash', 'COD','wallet'] 
    },
    status:{
        type:String,
        default:"Pending"
    },
    razorpayOrderId: {
        type: String,
        required: false // Optional, required when using Razorpay
    },
    orderID: {
        type: String,
        unique: true, // Ensure the orderID is unique
        // required: true
    },
    date:{
        type:Date,
        required:true
    },
    cartID: { // Added field for Cart ID
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    }
},{versionKey:false,timestamps:true})

// Pre-save middleware to generate a random orderID
orderSchema.pre('save', function(next) {
    if (!this.orderID) {
        this.orderID = generateOrderID();
    }
    next();
});

// Function to generate a random orderID
const generateOrderID = function() {
    let orderID = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 5; // Length of the orderID

    for (let i = 0; i < length; i++) {
        orderID += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return orderID;
};


module.exports = new mongoose.model('Order',orderSchema)