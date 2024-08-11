const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const userRouter = express();
const session = require('express-session');
const {productUpload}=require('../middlewares/multer')
const userController = require('../controllers/userController');
const userAuth=require('../middlewares/usermiddleware')
const addressController = require('../controllers/addressController');
const  productController=require('../controllers/productController');
const blockAuth=require('../middlewares/userBlock')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const wishlistController=require('../controllers/wishlishController')
const couponController=require('../controllers/couponController')
const walletController=require('../controllers/walletController')
const invoiceController = require('../controllers/invoiceController');
require('../middlewares/passport')

userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));

userRouter.use(passport.initialize());
userRouter.use(passport.session());




userRouter.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true
}));


// Middleware to handle flash messages
userRouter.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  delete req.session.successMessage;
  next();
});

userRouter.get("/register",userAuth.islogin,userController.userRegister);
userRouter.post("/register",userController.userRegisterPost);
userRouter.get("/",userController.home);

userRouter.get("/login",userAuth.islogin,userController.userLogin);
userRouter.post("/login",userAuth.islogin,userController.verifyUser);
userRouter.get("/logout",userAuth.islogout,userController.Userlogout);


userRouter.get('/verifyOTP',userAuth.islogin,userController.verifyOtp)
userRouter.post("/verifyOTP",userController.otpVerificationPost);
userRouter.post('/resendOtp',userController.resendOtp);

userRouter.get("/products",userController.displayProducts);
userRouter.get("/productDetails",blockAuth.isBlock,userController.ProductsDetails);
userRouter.get("/quickDetails",blockAuth.isBlock,userController.quickDetails);

userRouter.get('/profile',userAuth.islogout,addressController.userProfile)
userRouter.get('/address',userAuth.islogout,addressController.address)
userRouter.get('/addAddress',userAuth.islogout,addressController.getaddAddress)
userRouter.post('/addAddress',addressController.postaddAddress)
userRouter.get('/editAddress',userAuth.islogout,addressController.editAddress)
userRouter.post('/editAddress',addressController.postEditAddress)

userRouter.post('/deleteAddress',addressController.deleteAddress)
userRouter.get('/accountDetails',addressController.accountDetails)
userRouter.post('/accountDetails',addressController.postAccountDetails)

userRouter.get('/cart',userAuth.islogout,cartController.getCart)
userRouter.post('/addCart',cartController.addCart)
userRouter.post('/getStock',cartController.getStock)
userRouter.post('/removeItem', cartController.removeCartItem);
userRouter.post('/increment', cartController.incrementProduct);
userRouter.post('/decrement', cartController.decrementProduct);

userRouter.get('/checkOut', userController.getCheckOut);
userRouter.post('/modaladdAddress', userController.modaladdAddress);
userRouter.post('/modaleditAddress', userController.modaleditAddress);
 
userRouter.post('/placeOrder', orderController.placeOrder);

userRouter.get('/orderSuccess', orderController.orderSuccess);
userRouter.get('/orders',userAuth.islogout,orderController.getOrder)
userRouter.get('/viewOrder',orderController.getViewOrder)
userRouter.post('/cancelorder',orderController.usercancelOrder)
userRouter.post('/return',orderController.returnOrder)
userRouter.post('/cancelreturn',orderController.cancelReturn)
userRouter.post('/paymentfailed', orderController.paymentfailed);
userRouter.post('/payagain', orderController.payAgain);
userRouter.post('/successpayment', orderController.successPayment);



userRouter.post('/createOrder',orderController.createOrder)
userRouter.post('/paymentsuccess',orderController.paymentsuccess)


userRouter.get('/wishlist',wishlistController.displayWishlist)
userRouter.post('/addwishlist',wishlistController.addToWishlist)
userRouter.patch('/removewishlist',wishlistController.removeWishlist)

userRouter.get('/wallet',walletController.getwallet)



userRouter.post('/apply-coupon', couponController.applyCoupon);
userRouter.post('/remove-coupon', couponController.removeCoupon);

userRouter.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

userRouter.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/userprofile');
});

// Profile route
userRouter.get('/userprofile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`Hello ${req.user.displayName}`);
});

// Logout route
userRouter.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Main route
userRouter.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/userprofile');
  }
  res.send('Please login');
});
module.exports=userRouter;