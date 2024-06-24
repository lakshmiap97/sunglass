const User = require('../models/userModel');

const isBlock=async(req,res,next)=>{
    try {
        if(req.session.user){
            const uID=req.session.user
            const user=await User.findById(uID)
            if(user){
                if(user.isActive==false){
                    req.session.user=null
                    res.redirect('/login')
                }
            }
        }
        next()
    } catch (error) {
      console.log(error.message)  
    }
}
module.exports={isBlock}