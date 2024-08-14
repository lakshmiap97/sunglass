const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        index: true
    },
    description:{
        type:String,
        required:true
    },
    price:{
       salesPrice:{type:Number,default:0},
       regularPrice:{type:Number},
      
    //    required:true
    
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category'
    },
    image:{
        type:Array,
        
    },
    
   color:{
      black:{
        quantity:{
            type:Number,
            required:true
        }
      },
      blue:{
        quantity:{
            type:Number,
            required:true
        }
      },
      red:{
        quantity:{
            type:Number,
            required:true
        }
      },
      green:{
        quantity:{
            type:Number,
            required:true
        }
      },
      yellow:{
        quantity:{
            type:Number,
            required:true
        }
      },
   },

   totalQuantity: {
    type: Number,
    required: true,
    default: 0
},
productDiscount:{
    type:Number,
    default:0
},

  discountExpiry:{
    type:Date,
   },

   isActive:{
        type:Boolean,
        default:true
    },
    
    createdAt:{
        type:Date,
        default:Date.now()
    }
})




module.exports = mongoose.model('Product',productSchema)