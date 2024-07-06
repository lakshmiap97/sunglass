const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    balance:{
        type:Number,
        default:0
    },
    walletdata:[{
        history:{
            type:String,
        },
        date:{
            type:Date,
        },
        paymentmethod:{
            type:String,
        },
        transactionID:{
            type:String
        }
    }]
})

module.exports = mongoose.model('Wallet',walletSchema)