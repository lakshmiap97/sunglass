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

const addCoupon = async (req, res) => {
    try {
        const { name, discount, maxdiscount, expirydate, minpurchase } = req.body;
        console.log(req.body);

        // Check if the coupon name already exists
        const existingCoupon = await Coupon.findOne({ name: name.trim() });
        if (existingCoupon) {
            // If the coupon name exists, return an error response
            return res.status(400).json({ success: false, message: 'Coupon name already exists' });
        }

        // Convert discount and maxdiscount to numbers
        const minDiscount = parseFloat(discount);
        const maxDiscount = parseFloat(maxdiscount);

        // Check if discount and maxdiscount are valid percentages
        if (isNaN(minDiscount) || isNaN(maxDiscount) || minDiscount < 0 || minDiscount > 100 || maxDiscount < 0 || maxDiscount > 100) {
            return res.status(400).render("admin/addCoupon", { message: "Discount percentages must be between 0 and 100." });
        }
        

        // Check if maxdiscount is greater than or equal to discount
        if (maxDiscount < minDiscount) {
            return res.status(400).json({ success: false, message: 'Maximum discount must be greater than or equal to minimum discount.' });
        }

        // Create a new coupon
        const coupon = new Coupon({
            name: name.trim(),
            discount: minDiscount,
            maxdiscount: maxDiscount,
            expiryDate: expirydate,
            minPurchase: minpurchase
        });

        console.log(coupon);
        await coupon.save();
        res.redirect("/couponList");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

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

const postEditCoupon = async (req, res) => {
    try {
        const couponID = req.session.cid;
        const { name, discount, maxdiscount, expirydate, minpurchase } = req.body;

        // Check if the coupon name already exists and is not the current coupon being edited
        const existingCoupon = await Coupon.findOne({ name: name.trim(), _id: { $ne: couponID } });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon name already exists' });
        }

        // Convert discount and maxdiscount to numbers
        const minDiscount = parseFloat(discount);
        const maxDiscount = parseFloat(maxdiscount);

        // Check if discount and maxdiscount are valid percentages
        if (isNaN(minDiscount) || isNaN(maxDiscount) || minDiscount < 0 || minDiscount > 100 || maxDiscount < 0 || maxDiscount > 100) {
            return res.status(400).render("admin/editCoupon", {
                coupon: { name, discount: minDiscount, maxdiscount: maxDiscount, expiryDate: expirydate, minPurchase: minpurchase },
                user: req.session.user,
                message: "Discount percentages must be between 0 and 100."
            });
        }

        // Check if maxdiscount is greater than or equal to discount
        if (maxDiscount < minDiscount) {
            return res.status(400).render("admin/editCoupon", {
                coupon: { name, discount: minDiscount, maxdiscount: maxDiscount, expiryDate: expirydate, minPurchase: minpurchase },
                user: req.session.user,
                message: 'Maximum discount must be greater than or equal to minimum discount.'
            });
        }

        // Update the coupon
        await Coupon.findByIdAndUpdate(couponID, {
            $set: {
                name: name.trim(),
                discount: minDiscount,
                maxdiscount: maxDiscount,
                minPurchase: minpurchase,
                expiryDate: expirydate
            }
        });

        res.redirect('/couponList');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

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
        console.log('Request body....:', req.body); // Debug log
       

        const userID = req.session.user;
        if (!userID) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const { couponcode, cartID,subTotal } = req.body;

        // Find the user's cart
        const cart = await Cart.findById(cartID);
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        
        console.log('cart&subTotal',{cart,subTotal})

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
        console.log('randomDiscount',randomDiscount)
        console.log('discountAmount',discountAmount)
        console.log('discountedTotal',discountedTotal)


        coupon.user.push({ userID });
        await coupon.save();

        // Ensure the totalPrice remains unchanged and discountedTotal reflects the discount
        cart.totalPrice = discountedTotal;
        console.log(' cart.totalPrice', cart.totalPrice)
        cart.discountAmount = discountAmount;
        // cart.discountedTotal = discountedTotal;
        cart.appliedCoupon = {
            couponcode: coupon.couponcode,
            discount: randomDiscount,
            discountAmount: discountAmount
        };
        req.session.appliedCoupon = cart.appliedCoupon;
        await cart.save();
        console.log('<<cart//',cart)

        console.log(',,<<>>;;;mnn', { discountedTotal, discountAmount });

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
        const userID = req.session.user;
        console.log('userID',userID)
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

        const coupon = await Coupon.findOne({ couponcode: cart.appliedCoupon.couponcode, isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code or the coupon is inactive." });
        }

        // Remove the user from the coupon's user array
        coupon.user = coupon.user.filter(user => user.userID.toString() !== userID.toString());
        await coupon.save();

        const discountAmount = cart.appliedCoupon.discountAmount;
        console.log('discountAmount',discountAmount)
        let totalPrice = Number(cart.totalPrice);
       

        console.log('Before addition:', { totalPrice, discountAmount });

        // Adjust totalPrice and discountedTotal safely
        if (typeof cart.totalPrice === 'number' && !isNaN(cart.totalPrice)) {
            cart.totalPrice += discountAmount;
            console.log(' cart.totalPrice', cart.totalPrice)
        } else {
            console.error('Invalid total price value:', cart.totalPrice);
            return res.status(500).json({ success: false, message: "Invalid total price value." });
        }

        // Reset the appliedCoupon, discountAmount, and discountedTotal
        cart.totalPrice; 
        cart.appliedCoupon = null;
        cart.discountAmount = 0;
        cart.discountedTotal = cart.totalPrice;  // Reset discountedTotal to the original total price

        await cart.save();

        // Clear the applied coupon from the session
        req.session.appliedCoupon = null;

        res.json({
            success: true,
            cartDetails: {
                cartID: cart._id,
                user: cart.user,
                items: cart.items,
                totalPrice: cart.totalPrice.toFixed(2),
                discountAmount: cart.discountAmount.toFixed(2),
                discountedTotal: cart.discountedTotal.toFixed(2),
                appliedCoupon: cart.appliedCoupon,
            },
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