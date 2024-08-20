const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const userRouter = express();
const session = require('express-session');
const { productUpload } = require('../middlewares/multer');
const userController = require('../controllers/userController');
const userAuth = require('../middlewares/usermiddleware');
const addressController = require('../controllers/addressController');
const productController = require('../controllers/productController');
const blockAuth = require('../middlewares/userBlock');  // Importing the isBlock middleware
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const wishlistController = require('../controllers/wishlishController');
const couponController = require('../controllers/couponController');
const walletController = require('../controllers/walletController');
const invoiceController = require('../controllers/invoiceController');
require('../middlewares/passport');

userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: true }));

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

// Apply the isBlock middleware to routes after user authentication
userRouter.get("/register", userAuth.islogin, userController.userRegister);
userRouter.post("/register", userController.userRegisterPost);
userRouter.get("/", userController.home);

userRouter.get("/login", userAuth.islogin, userController.userLogin);
userRouter.post("/login", userAuth.islogin, userController.verifyUser);
userRouter.get("/logout", userAuth.islogout, userController.Userlogout);

userRouter.get('/verifyOTP', userAuth.islogin, userController.verifyOtp);
userRouter.post("/verifyOTP", userController.otpVerificationPost);
userRouter.post('/resendOtp', userController.resendOtp);

userRouter.get("/products", userController.displayProducts);
userRouter.get("/productDetails", userAuth.islogout, blockAuth.isBlock, userController.ProductsDetails);  // Applying isBlock
userRouter.get("/quickDetails", userAuth.islogout, blockAuth.isBlock, userController.quickDetails);      // Applying isBlock

userRouter.get('/profile', userAuth.islogout, blockAuth.isBlock, addressController.userProfile);          // Applying isBlock
userRouter.get('/address', userAuth.islogout, blockAuth.isBlock, addressController.address);              // Applying isBlock
userRouter.get('/addAddress', userAuth.islogout, blockAuth.isBlock, addressController.getaddAddress);     // Applying isBlock
userRouter.post('/addAddress', blockAuth.isBlock, addressController.postaddAddress);                     // Applying isBlock
userRouter.get('/editAddress', userAuth.islogout, blockAuth.isBlock, addressController.editAddress);      // Applying isBlock
userRouter.post('/editAddress', blockAuth.isBlock, addressController.postEditAddress);                   // Applying isBlock

userRouter.post('/deleteAddress', blockAuth.isBlock, addressController.deleteAddress);                    // Applying isBlock
userRouter.get('/accountDetails', userAuth.islogout, blockAuth.isBlock, addressController.accountDetails);// Applying isBlock
userRouter.post('/accountDetails', blockAuth.isBlock, addressController.postAccountDetails);             // Applying isBlock

userRouter.get('/cart', userAuth.islogout, blockAuth.isBlock, cartController.getCart);                    // Applying isBlock
userRouter.post('/addCart', blockAuth.isBlock, cartController.addCart);                                  // Applying isBlock
userRouter.post('/getStock', blockAuth.isBlock, cartController.getStock);                                // Applying isBlock
userRouter.post('/removeItem', blockAuth.isBlock, cartController.removeCartItem);                        // Applying isBlock
userRouter.post('/increment', blockAuth.isBlock, cartController.incrementProduct);                       // Applying isBlock
userRouter.post('/decrement', blockAuth.isBlock, cartController.decrementProduct);                       // Applying isBlock

userRouter.get('/checkOut', userAuth.islogout, blockAuth.isBlock, userController.getCheckOut);           // Applying isBlock
userRouter.post('/modaladdAddress', blockAuth.isBlock, userController.modaladdAddress);                 // Applying isBlock
userRouter.post('/modaleditAddress', blockAuth.isBlock, userController.modaleditAddress);               // Applying isBlock

userRouter.post('/placeOrder', blockAuth.isBlock, orderController.placeOrder);                          // Applying isBlock

userRouter.get('/orderSuccess', userAuth.islogout, blockAuth.isBlock, orderController.orderSuccess);   // Applying isBlock
userRouter.get('/orders', userAuth.islogout, blockAuth.isBlock, orderController.getOrder);              // Applying isBlock
userRouter.get('/viewOrder', userAuth.islogout, blockAuth.isBlock, orderController.getViewOrder);       // Applying isBlock
userRouter.post('/cancelorder', blockAuth.isBlock, orderController.usercancelOrder);                    // Applying isBlock
userRouter.post('/return', blockAuth.isBlock, orderController.returnOrder);                            // Applying isBlock
userRouter.post('/cancelreturn', blockAuth.isBlock, orderController.cancelReturn);                     // Applying isBlock
userRouter.post('/paymentfailed', blockAuth.isBlock, orderController.paymentfailed);                    // Applying isBlock
userRouter.post('/payagain', blockAuth.isBlock, orderController.payAgain);                              // Applying isBlock
userRouter.post('/successpayment', blockAuth.isBlock, orderController.successPayment);
userRouter.get('/get-cart-details', cartController.getCartDetails);                  // Applying isBlock

userRouter.post('/createOrder', blockAuth.isBlock, orderController.createOrder);                        // Applying isBlock
userRouter.post('/paymentsuccess', blockAuth.isBlock, orderController.paymentsuccess);                  // Applying isBlock

userRouter.get('/wishlist', userAuth.islogout, blockAuth.isBlock, wishlistController.displayWishlist);   // Applying isBlock
userRouter.post('/addwishlist', blockAuth.isBlock, wishlistController.addToWishlist);                   // Applying isBlock
userRouter.patch('/removewishlist', blockAuth.isBlock, wishlistController.removeWishlist);              // Applying isBlock

userRouter.get('/wallet', userAuth.islogout, blockAuth.isBlock, walletController.getwallet);            // Applying isBlock

userRouter.post('/apply-coupon', blockAuth.isBlock, couponController.applyCoupon);                     // Applying isBlock
userRouter.post('/remove-coupon', blockAuth.isBlock, couponController.removeCoupon);
                   // Applying isBlock

userRouter.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

userRouter.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/userprofile');
});

// Profile route
userRouter.get('/userprofile', userAuth.islogout, blockAuth.isBlock, (req, res) => {                     // Applying isBlock
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

module.exports = userRouter;
