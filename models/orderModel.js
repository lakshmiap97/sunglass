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
        default:"Confirmed"
    },
    date:{
        type:Date,
        required:true
    }
},{versionKey:false,timestamps:true})

module.exports = new mongoose.model('Order',orderSchema)