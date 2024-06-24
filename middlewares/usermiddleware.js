const { userLogin } = require("../controllers/userController")

const islogin=(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect("/")
        }else{
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

const islogout=(req,res,next)=>{
    try {
        if(req.session.user){
            next()
            
        }else{
            res.redirect("/login") 
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    islogin,
    islogout
}
