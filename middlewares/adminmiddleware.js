const isloginAdmin=(req,res,next)=>{
    try {
        if(req.session.admin){
            res.redirect("/userList")
        }else{
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

const islogoutAdmin=(req,res,next)=>{
    try {
        if(req.session.admin){
            next()
            
        }else{
            res.redirect("/admin") 
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    isloginAdmin,
    islogoutAdmin
}

