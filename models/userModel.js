const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
   name:{
      type:String,
      required:true
   },
   email:{
      type:String,
      required:true
   },
   password:{
      type:String,
      required:true
   },
   mobile:{
      type:Number,
      required:true
   },
   is_admin:{
      type:Number,
      default:0
   },
   isActive: {
      type: Boolean,
      default:true
  }},
   {
   timestamps:true
}
)


module.exports = mongoose.model('User',userModel);


