const express = require('express');
const adminRouter = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const adminController = require('../controllers/adminController')
const categoryController=require('../controllers/categoryController')
const productController=require('../controllers/productController')
const {productUpload}=require('../middlewares/multer')
const adminAuth=require('../middlewares/adminmiddleware')
const orderController=require('../controllers/orderController')
const couponController=require('../controllers/couponController')


adminRouter.use(session({
   secret: process.env.secret,
   resave: false,
   saveUninitialized: true
}));

adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));


adminRouter.get('/admin',adminAuth.isloginAdmin,adminController.loadLogin);
adminRouter.post('/admin',adminController.verifyUser);
adminRouter.get('/adminlogout',adminAuth.islogoutAdmin,adminController.adminLogout);


adminRouter.get('/adminDash',adminAuth.isloginAdmin,adminController.getAdminDash)
adminRouter.get('/userList',adminController.displayUser)
adminRouter.get('/admin/userStatus',adminController.unblockUser);

adminRouter.get('/categories',categoryController.displayAddCategory);
adminRouter.post('/categories',categoryController.postAddCategories);
adminRouter.get('/admin/categoryStatus',categoryController.blockCategory);
adminRouter.get('/editCategory',categoryController.editCategory);
adminRouter.post('/editCategory',categoryController.postEditCategory);

adminRouter.get('/product',productController.displayProduct)
adminRouter.get('/addProduct',productController.displayAddProduct)
adminRouter.post('/addProduct',productUpload,productController.addProduct)
adminRouter.get('/editProduct',productController.editProduct)
adminRouter.post('/editProduct',productUpload,productController. postEditProduct)
adminRouter.get('/productStatus',productController.blockProduct)
adminRouter.post('/deleteImage',productController.deleteImage)

adminRouter.get('/orderlist',orderController.displayorder)
adminRouter.get('/orderdetails',orderController.displayOrderDetails)
adminRouter.post('/orderdetails',orderController.updateOrderStatus)

adminRouter.get('/couponList',couponController.displayCoupon)
adminRouter.get('/addCoupon',couponController.displayAddCoupon)
adminRouter.post('/addCoupon',couponController.addCoupon)
adminRouter.get('/editCoupon',couponController.getEditCoupon)
adminRouter.post('/editCoupon',couponController.postEditCoupon)
adminRouter.get('/blockCoupon',couponController.blockCoupon)

adminRouter.get('/categoryOffer',categoryController.categoryOffer)
adminRouter.get('/addcategoryoffer',categoryController.getCategoryOffer)
adminRouter.post('/addcategoryoffer',categoryController.postCategoryOffer)
adminRouter.get('/productOffer',productController.productofferLoad)
// adminRouter.get('/productAddOffer',productController.productAddOffer)

// adminRouter.get('/productAddOffer',productController.deleteProductOffer)





module.exports = adminRouter;