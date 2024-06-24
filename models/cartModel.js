const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user:{
     type:mongoose.Schema.Types.ObjectId,
     ref:'User',
     required:true
    },
    items:[{
     productID:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'Product',
         require:true
     },
     amount:{
         type:Number
     },
     quantity:{
         type:Number,
     },
     price:{
         type:Number
     },
     color:{
         type:String,
         required:true
     }
    }],
    appliedCoupon: {
        couponcode: String,
        discount: Number,
        discountAmount: Number
        
    },
    totalPrice:{
     type:Number
    }
 })
 
 module.exports = mongoose.model('Cart',cartSchema)