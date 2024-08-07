const Coupon = require("../models/couponModel")
const Cart=require('../models/cartModel')

const displayCoupon = async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    try {
        const coupon = await Coupon.find({})
        .limit(limit)
        .skip(skip)
        .collation({ locale: 'en', strength: 2 })
        .exec();
        console.log(coupon);
        const totalcoupon = await Coupon.countDocuments({});
        const totalpage = Math.ceil(totalcoupon / limit);
        res.render('admin/couponList',{coupon:coupon,totalcoupon:totalcoupon,totalpage:totalpage,currentpage:page})
    } catch (error) {
        console.log(error.message);
    }
}

const displayAddCoupon = async(req,res)=>{
    try {
        res.render('admin/addCoupon')
    } catch (error) {
        console.log(error.message);
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {name,discount,maxdiscount,expirydate,minpurchase} = req.body
        console.log(req.body);
          // Check if the coupon name already exists
          const existingCoupon = await Coupon.findOne({ name: name.trim() });
          if (existingCoupon) {
              // If the coupon name exists, return an error response
              return res.status(400).json({ success: false, message: 'coupon name already exists' });
          }

        const coupon = new Coupon ({
            name:name,
            discount:discount,
            maxdiscount:maxdiscount,
            expiryDate:expirydate,
            minPurchase:minpurchase
        })
        console.log(coupon);
        await coupon.save();
        res.redirect("/couponList")
    } catch (error) {
        console.log(error.message);
    }
}

const getEditCoupon = async(req,res)=>{
    try {
        const user = req.session.user;
        const couponID = req.query.id
        req.session.cid = couponID
        const coupon = await Coupon.findById({_id:couponID})
        res.render('admin/editCoupon',{coupon,user})
    } catch (error) {
        console.log(error.message);
    }
}

const postEditCoupon = async(req,res)=>{
    try {
        const user = req.session.user;
        const couponID = req.session.cid
        const {name,discount,maxdiscount,expirydate,minpurchase} = req.body
        const coupon = await Coupon.findByIdAndUpdate({_id:couponID},
            {$set:{
                name:name,
                discount:discount,
                maxdiscount:maxdiscount,
                minPurchase:minpurchase,
                expiryDate:expirydate
            
            }})
            res.redirect('/couponList')
    } catch (error) {
        console.log(error.message);
    }
}

const blockCoupon = async(req,res)=>{
    try {
        const couponID = req.query.id
        const coupon = await Coupon.findById({_id:couponID})
        if (!coupon) {
            // Coupon not found
            return res.status(404).send('Coupon not found');
        }

        await Coupon.findByIdAndDelete(couponID);
        res.redirect('/couponList');
    } catch (error) {
        console.log(error.message);
    }
}


const applyCoupon = async (req, res) => {
    try {
        console.log('Session user:', req.session.user); // Debug log
        console.log('Request body:', req.body); // Debug log

        const userID = req.session.user;
        if (!userID) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const { couponcode, subTotal, cartID } = req.body;
        if (!couponcode || !subTotal || !cartID) {
            return res.status(400).json({ success: false, message: "Coupon code, subtotal, and cart ID are required." });
        }

        const coupon = await Coupon.findOne({ couponcode, isActive: true });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code or the coupon is inactive." });
        }

        if (coupon.user.some(user => user.userID.toString() === userID.toString())) {
            return res.status(400).json({ success: false, message: "You have already used this coupon code" });
        }

        if (subTotal < coupon.minPurchase) {
            return res.status(400).json({ success: false, message: 'Order amount does not meet the minimum purchase requirement for this coupon.' });
        }

        const randomDiscount = Math.floor(Math.random() * (coupon.maxdiscount - coupon.discount + 1)) + coupon.discount;
        const discountAmount = (randomDiscount / 100) * subTotal;
        const discountedTotal = subTotal - discountAmount;

        coupon.user.push({ userID });
        await coupon.save();

        // Update the user's cart with the applied coupon information
        const cart = await Cart.findById(cartID);
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        cart.discountAmount = discountAmount;
        cart.discountedTotal = discountedTotal;
        cart.appliedCoupon = {
            couponcode: coupon.couponcode,
            discount: randomDiscount,
            discountAmount: discountAmount
        };

        await cart.save();

        res.json({ 
            success: true, 
            discount: randomDiscount.toFixed(2), 
            discountAmount: discountAmount.toFixed(2), 
            discounted: discountedTotal.toFixed(2), 
            message: 'Coupon applied successfully.' 
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while applying the coupon.' });
    }
};

const removeCoupon = async (req, res) => {
    try {
        console.log('Session user:', req.session.user); // Debug log
        console.log('Request body:', req.body); // Debug log

        const userID = req.session.user;
        if (!userID) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const { cartID } = req.body;
        if (!cartID) {
            return res.status(400).json({ success: false, message: "Cart ID is required." });
        }

        // Find the user's cart
        const cart = await Cart.findById(cartID);
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        // Check if there's a coupon applied
        if (!cart.appliedCoupon || !cart.appliedCoupon.couponcode) {
            return res.status(400).json({ success: false, message: "No coupon applied to the cart." });
        }

        // Find the coupon
        const coupon = await Coupon.findOne({ couponcode: cart.appliedCoupon.couponcode, isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code or the coupon is inactive." });
        }

        // Remove user from coupon's user array
        coupon.user = coupon.user.filter(user => user.userID.toString() !== userID.toString());
        await coupon.save();

        // Remove coupon from cart
        cart.discountAmount = 0;
        cart.discountedTotal = cart.subTotal; // Assuming subTotal is stored in the cart
        cart.appliedCoupon = null;

        await cart.save();

        res.json({ 
            success: true, 
            message: 'Coupon removed successfully.' 
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while removing the coupon.' });
    }
};



module.exports = {
    displayCoupon,
    displayAddCoupon,
    addCoupon,
    getEditCoupon,
    postEditCoupon,
    blockCoupon,
    applyCoupon,
    removeCoupon,
}