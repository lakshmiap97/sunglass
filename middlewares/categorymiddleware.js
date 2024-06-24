const categoryController = require('../controllers/categoryController')


const categoryMiddleware = async(req,res,next) =>{
    try{
        const allCategories = await categoryController.getAllcategory()
        res.locals.allCategories = allCategories
        next()
    }catch{
        console.error('Error fetching categories:', error);
        res.status(500).redirect('/error')
    }
}

module.exports =categoryMiddleware;