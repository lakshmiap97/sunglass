const bcrypt = require('bcrypt');
const session = require('express-session');

const  generateOtp = require('../controllers/otpController/generateOTP')
const sendOtpMail = require("../controllers/otpController/sendOTP");
const User = require('../models/userModel');
const Product=require('../models/productModel')
const {getAllProducts}=require('../controllers/productController')
const Category=require('../models/categoryModel')
const {getAllcategory}=require('../controllers/categoryController')
const Address=require('../models/addressModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require("../models/couponModel")
const Offer=require('../models/offerModel')
const Order=require('../models/orderModel')

const securePasswordFunction = async(password) => {
    try{
        const passwordHash = await bcrypt.hash(password, 10)
            return passwordHash
    }catch(error){
        console.log(error.message)
        res.status(500).send('sever error')
    }
}


const userLogin = async (req,res) =>{
    try{
        res.render("user/login");
    }
    catch(error){
        console.log(error);
        res.status(500).send('sever error')
    }
}


const verifyUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ email: email, isActive: true });

        if (findUser) {
            const passwordMatch = await bcrypt.compare(password, findUser.password);
            if (passwordMatch) {
                req.session.user = findUser._id; // Set user data in session
                res.redirect("/");
            } else {
                res.render("user/login", { message: "Invalid password" });
            }
        } else {
            res.render("user/login", { message: "Blocked user" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};
const home = async (req,res) =>{
    try{
        const userID = req.session.user; // Retrieve userID from session
        const user=await User.findOne({_id:userID})
        const cart = await Cart.find({user:user})
        console.log(cart)
        const products=await getAllproductsWithLookUp();
        const message = req.query.message;
        res.render("user/home",{products,user,userID,cart,message});

    }
    catch(error){
        console.log(error);
        res.status(500).send('server error')
    }
}




const Userlogout = async (req, res) => {
    try {
        if (req.session.user) {
            req.session.destroy((error) => {
                if (error) {
                    console.log("Error destroying session:", error);
                }
                res.redirect('/');
            });
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error("Error logging out user:", error);
        res.redirect("/");
    }
}

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next()
    } else {
        res.redirect('/home')
    }
}


const userRegister = async (req,res) =>{
    try{
        res.render("user/register");
    }
    catch(error){
        console.log(error);
        res.status(500).send('sever error')
    }
}


const userRegisterPost = async (req,res) =>{
    try{
        console.log("Getting inside a post user");
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const password = req.body.password;
        

        const confirmPassword = req.body.confirmPassword;

        
        if(password!== confirmPassword){
            return res.render("user/register" , {message: "Password do not match" });
        }

        const userExist = await User.find({ $or: [{mobile:mobile}, {email:email}]});
            

        if(userExist.length > 0){
            return res.render("user/register" , {message: "User already exists"});
        }

        console.log("User does not exists");

       
        const securePassword = await securePasswordFunction(password);

        const userData = {
            name: name,
            email: email,
            mobile: mobile,
            password: securePassword
        };
        
        req.session.userData = userData;
        console.log(req.session.userData);
     
        const generatedOtp = generateOtp();
        req.session.otp = generatedOtp;
        req.session.timer = Date.now();
        console.log("Generated OTP: ", generatedOtp);

       
        sendOtpMail(email,generatedOtp);
        console.log(email,generatedOtp);
    
        const otpExpiration = Date.now() + 60*1000;
        req.session.otpExpiration = otpExpiration;
        req.session.userEmail = email;

       
        res.render("user/otp-form",{ otpExpiration, email, message: "Registration successful!" });
    } 
    catch(error){
        console.error(error.message);
        res.status(500).send("Internal server error")
    }
};
const verifyOtp = async (req,res) => {
    try{
        const otpExpiration = req.session.otpExpiration;
        console.log(otpExpiration);
        const email = req.session.userEmail;
        console.log(email);
        res.render('user/otp-form',{otpExpiration,email});
    }
    catch(error){
        console.log(error.message);
        res.status(500).send('sever error')
    }
}

const createUser = async (userData) => {
    return await User.create(userData);
}
        
   

const otpVerificationPost = async (req,res) => {
    try{
            const currentTimer = Date.now();
            const timer = req.session.timer;
            const otpExpiration = req.session.otpExpiration; // Retrieve otpExpiration from session
            const email = req.session.userEmail;
    

            if (currentTimer - timer > 60000) {
                console.log("OTP timeout");
                res.render('user/otp-form', {otpExpiration, email ,message:"OTP has been timeout"})
            }
            else{
                const storedOtp = req.session.otp;
                const enteredOtp = req.body.otp;

                console.log("storedOtp:" , storedOtp);
                console.log("enteredOtp:" , enteredOtp);

                if(storedOtp == enteredOtp){
                    const userData = req.session.userData
                    const createdUser = await createUser(userData)
                    res.redirect("/login")
                }else{
                    const email=req.session.email;
                    const otpExpiration=req.session.otpExpiration
                    res.render('user/otp-form',{otpExpiration, email ,message:'Incorrect OTP'})
                }
            }
    }catch(error){
        console.log(error.message);
        res.status(500).send('sever error...ki')
    }
};


let lastotpGeneration = 0
const resendOtp = async (req, res) => {
    try {
        console.log('gets here');
        const currentTime = Date.now();
        const timediff = currentTime - lastotpGeneration / 1000
       
        if (timediff < 60) {
            res.send(400).json({ message: 'Wait before resending' })
        }
        const generatedNewOtp = generateOtp();
        const email = req.session.userEmail
    
        const globalOtp = generatedNewOtp
        req.session.otp = globalOtp
    
        req.session.timer = Date.now()
        console.log(globalOtp);
        console.log('hi..');
        sendOtpMail(email, globalOtp)
          console.log("resendotp:",globalOtp)
        const otpExpiration = Date.now() + 60 * 1000;
        req.session.otpExpiration = otpExpiration;
        res.redirect('/verifyOtp')

      

    } catch (error) {
        console.log(error.message,'this is error');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getProducts=async(req,res)=>{
    try {
        const products=await Product.find();
        res.json(products)
    } catch (error) {
       console.log(message.error) 
       
    }
}

const getAllproductsWithLookUp = async () => {
    try {
        const result = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $match:{
                    isActive:true,
                    "category.isActive":true,
                },
            },
        ]);
        return result;
    } catch (error) {
        console.error('Error fetching products with lookup:', error);
        throw new Error('Error fetching products with lookup');
    }
};




const displayProducts = async (req, res) => {
    try {
        // Retrieve user information and active categories
        const userID = req.session.user;
        const user = await User.findOne({ _id: userID });
        const categories = await Category.find({ isActive: true });
        const message = req.query.message;
        // Extract query parameters with default values
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const categoryId = req.query.id || 'all';

        // Initialize the query object
        let query = { isActive: true };

        // Add search criteria if a search term is provided
        if (search) {
            query.name = {$regex: search, $options: 'i' }; // Match names starting with the search term
        }

        // Add category criteria if a category ID is provided and not 'all'
        if (categoryId !== 'all') {
            query.category = categoryId;
        }
      

        // Determine sorting options based on the sort query parameter
        let sortOptions = {};
        const sort = req.query.sort || 'relevance';
        if (sort === 'hightolow') {
            sortOptions = { 'price.salesPrice': -1 };
        } else if (sort === 'lowtohigh') {
            sortOptions = { 'price.salesPrice': 1 };
        } else if (sort === 'AaZz') {
            sortOptions = { name: 1 };
        } else if (sort === 'ZzAa') {
            sortOptions = { name: -1 };
        }

        // Get the total number of products matching the query
        const totalProducts = await Product.countDocuments(query);
        const totalpage = Math.ceil(totalProducts / limit);

        // Get the products matching the query with pagination and sorting
        const products = await Product.find(query)
            .sort(sortOptions)
            .collation({ locale: 'en', strength: 3 }) // Case-insensitive sorting
            .skip(skip)
            .limit(limit)
            .populate('category')
            .lean();

        // Render the shop page with the retrieved data
        res.render('user/shop', {
            products,
            user,
            userID,
            categories,
            totalProducts,
            totalpage,
            currentPage: page,
            sort,
            search,
            page,
            categoryId,
            message,
            noResults: products.length === 0 // Pass a flag to the template if no products are found
        });

    } catch (error) {
        console.log(error);
        res.status(500).render('error', { error });
    }
};




const ProductsDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findOne({_id: productId});
        if (!product) {
            return res.render('user/product details', {error: "Product not found", product: null, user: null, userData: null, relatedProducts: [], category: null, applicableOffer: null});
        }
        const category = await Category.findById(product.category);
        const userData = req.session.user;
        const user = await User.findOne({_id: userData});
        const relatedProducts = await Product.find({category: product.category, _id: {$ne: productId}}).limit(4);

        // Fetch product offer if it exists
        const productOffer = await Offer.findOne({"productOffer.product": productId, "productOffer.offerStatus": true});

        // Fetch category offer if it exists
        const categoryOffer = await Offer.findOne({"categoryOffer.category": product.category, "categoryOffer.offerStatus": true});
        
        // Determine the applicable offer (whichever is higher)
        let applicableOffer = null;
        if (productOffer && categoryOffer) {
            applicableOffer = productOffer.productOffer.discount > categoryOffer.categoryOffer.discount ? productOffer.productOffer : categoryOffer.categoryOffer;
        } else if (productOffer) {
            applicableOffer = productOffer.productOffer;
        } else if (categoryOffer) {
            applicableOffer = categoryOffer.categoryOffer;
        }

        res.render('user/product details', {product, user, userData, relatedProducts, category, applicableOffer, error: null});
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).render('user/product details', {error: "Internal Server Error", product: null, user: null, userData: null, relatedProducts: [], category: null, applicableOffer: null});
    }
};

const quickDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findOne({_id: productId});
        if (!product) {
            return res.status(404).send("Product not found");
        }
        const category = await Category.findById(product.category);
        const userData = req.session.user;
        const user = await User.findOne({_id: userData});
        const relatedProducts = await Product.find({category: product.category});
        
        // Fetch the wishlist for the user
        const wishlist = await Wishlist.findOne({user: user._id});
        
        // Render the template with all the necessary data
        res.render('user/quick', {
            product,
            user,
            userData,
            relatedProducts,
            category,
            wishlist // Pass the wishlist data to the template
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).render('error', {error});
    }
};

  
      
    const getCheckOut = async (req, res) => {
        try {
            const userID = req.session.user;
            console.log('userID', userID);
            if (!userID) {
                return res.status(401).send('User not logged in');
            }
    
            const user = await User.findById(userID);
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            const coupon = await Coupon.find({ isActive: true });
            const addressDocument = await Address.findOne({ user: userID });
            const usersCart = await Cart.findOne({ user: userID }).populate('items.productID');
    
            if (!usersCart || usersCart.items.length === 0) {
                return res.status(400).json({ message: 'Cart is empty, please add items to your cart.' });
            }
    
            const cartID = usersCart._id;
            console.log('cart>>', cartID);
    
            const cartItems = usersCart.items || [];
            const addresses = addressDocument ? addressDocument.addresses : [];
            const subTotal = cartItems.reduce((sum, item) => sum + (item.price), 0);
            const discountAmount = usersCart.appliedCoupon ? usersCart.appliedCoupon.discountAmount : 0;
            const totalPrice = discountAmount ? subTotal - discountAmount : subTotal;
    
            // Update the total price in the cart model if needed
            usersCart.totalPrice = totalPrice;
            await usersCart.save();
            console.log('subTotal',subTotal)
    
            res.render('user/checkOut', { cartItems, addresses, subTotal, totalPrice, user, userID, cartID, coupon, usersCart , discountAmount});
        } catch (error) {
            console.error(error); // Log the error for debugging purposes
            res.status(500).send('An error occurred while fetching checkout data.'); // Send a generic error message
        }
    };
    

      const modaladdAddress = async (req, res) => {
        try {
          const { name, mobile, address, city, state, country, pincode } = req.body;
          const userID = req.session.user;
      
          let userAddressDocument = await Address.findOne({ user: userID });
      
          if (!userAddressDocument) {
            userAddressDocument = new Address({
              user: userID,
              addresses: []
            });
          }
      
          userAddressDocument.addresses.push({
            name,
            mobile,
            address,
            city,
            state,
            country,
            pincode
          });
      
          await userAddressDocument.save();
          res.redirect('/checkOut');
        } catch (error) {
          console.error('Error adding address:', error);
          res.status(500).json({ success: false, message: 'Failed to add address', error });
        }
      };
      



      const modaleditAddress = async (req, res) => {
        try {
          const { _id, name, mobile, address, city, state, pincode, locality, country } = req.body;
          const userID = req.session.user;
      
          const updatedAddress = await Address.findOneAndUpdate(
            { user: userID, "addresses._id": _id },
            {
              $set: {
                "addresses.$.name": name,
                "addresses.$.mobile": mobile,
                "addresses.$.address": address,
                "addresses.$.city": city,
                "addresses.$.state": state,
                "addresses.$.pincode": pincode,
                "addresses.$.locality": locality,
                "addresses.$.country": country,
              }
            },
            { new: true }
          );
      
          if (updatedAddress) {
            res.status(200).json({ success: true, message: "Address updated successfully", address: updatedAddress });
          } else {
            res.status(404).json({ success: false, message: "Address not found" });
          }
        } catch (error) {
          console.error("Error updating address:", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        }
      };
      
    /* ============checkout===========*/
    const getInvoice = async(req,res)=>{
        try {
            const oid = req.query.id
            const order = await Order.find({_id:oid}).populate("products.product") 
            res.render('user/invoice',{order})
        } catch (error) {
            console.log(error.message);
        }
    }


module.exports = {
    home,
    userRegister,
    userLogin,
    verifyUser,
    userRegisterPost,
    verifyOtp,
    otpVerificationPost,
    resendOtp,
    getProducts,
    displayProducts,
    ProductsDetails,
    Userlogout,
    isAuthenticated,
    quickDetails,
    getCheckOut,
    modaladdAddress,
    modaleditAddress ,
    getInvoice,
}