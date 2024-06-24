const mongoose = require('mongoose'); 
const { ObjectId } = mongoose.Types; 
const Order = require('../models/orderModel');
const User = require("../models/userModel");
const Product = require('../models/productModel');
const Address = require("../models/addressModel");
const Cart = require('../models/cartModel');
const Razorpay=require('razorpay')

const razorpay=new Razorpay({
    key_id:'rzp_test_8oA5wZD2fGxjcW',
    key_secret:'fX9soMFss7DEe30ldooZGorC'
})


const createOrder = async (req, res) => {
    try {
        const amount = parseInt(req.body.totalPrice);
        const order = await razorpay.orders.create({
            amount: amount * 100, // Amount in smallest currency unit
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });
        res.json({ orderID: order });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


const paymentsuccess = async (req, res) => {
    try {
        const { paymentid, razorpayorderid, signature, orderid } = req.body;
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha256', razorpay.key_secret)
                           .update(`${orderid}|${paymentid}`)
                           .digest('hex');

        if (hash === signature) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            return res.status(401).send('User not logged in');
        }

        const user = await User.findById(userID);
        const { cartID, totalPrice, paymentMethod, productsID, addressID } = req.body;

        // Log the request body to debug
        console.log('Request Body:', req.body); // Log the entire request body
        console.log('Payment Method:', paymentMethod); // Log the payment method

        if (!ObjectId.isValid(cartID)) {
            return res.status(400).send('Invalid cart ID');
        }

        let products;
        try {
            products = JSON.parse(productsID);
        } catch (error) {
            console.error('Error parsing productsID:', error);
            return res.status(400).send('Invalid productsID format');
        }

        const addressDocument = await Address.findOne({ 'addresses._id': new ObjectId(addressID) });
        if (!addressDocument) {
            return res.status(404).send('Address not found');
        }

        const address = addressDocument.addresses.id(addressID);
        console.log('Address:', address); // Log the address

        const newOrder = new Order({
            user: userID,
            address: {
                name: address.name,
                mobile: address.mobile,
                pincode: address.pincode,
                locality: address.locality,
                address: address.address,
                city: address.city,
                state: address.state,
                country: address.country
            },
            products: products.map(product => ({
                product: product.id,
                quantity: product.quantity,
                color: product.color,
                amount: product.amount
            })),
            totalamount: totalPrice,
            paymentmethod: paymentMethod, // Ensure this field is populated
            status: 'Confirmed',
            date: new Date().toISOString().split('T')[0]
        });

        const savedOrder=await newOrder.save();
      console.log('neworder',newOrder)
        await Cart.findOneAndDelete({ _id: new ObjectId(cartID) });
        res.status(200).json({ success: true, message: 'Order placed successfully', orderID: savedOrder._id });
       
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const orderSuccess = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            return res.status(401).send('User not logged in');
        }

        const user = await User.findById(userID);
        const addresses = await Address.findOne({ user: userID });
        res.render('user/ordersuccess', { userID, user, addresses });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const displayorder = async (req, res) => {
    try {
        const userID = req.session.user;
        

        const order = await Order.find({});
        res.render('admin/orderlist', { order, userID });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};


const displayOrderDetails = async (req, res) => {
    try {
        const orderID = req.query.id;
        const order = await Order.findOne({_id:orderID}).populate('products.product');
        // const order = await Order.findById(orderID).populate('products.product').populate('user').populate('address');
        console.log("order is: " + order);
        res.render('admin/orderdetails', { order });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};





const updateOrderStatus = async (req, res) => {
    const { productID, statusID, orderID } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderID) || !mongoose.Types.ObjectId.isValid(productID)) {
        return res.status(400).json({ success: false, message: 'Invalid Order ID or Product ID' });
    }

    try {
        console.log(orderID, " -- ", statusID);

        // Find the order by ID
        const order = await Order.findById(orderID);
        console.log("order is >>", order);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update the status
        order.status = statusID;

        // Save the updated order
        await order.save();

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

const getOrder = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            throw new Error('User not logged in');
        }

        const user = await User.findById(userID);
        if (!user) {
            throw new Error('User not found');
        }

        const orders = await Order.find({ user: userID }).populate('products.product');
        console.log('>>order>>',orders)
        res.render('user/order', { orders, userID, user });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const getViewOrder = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            return res.status(401).send('User not logged in');
        }

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const orderID = req.query.id;
        console.log('Order ID:', orderID); // Debug statement

        const orders = await Order.findById(orderID).populate("products.product");
        console.log('Retrieved Order>>:', orders); // Debug statement

        if (!orders) {
            return res.status(404).send('Order not found');
        }

        res.render('user/viewOrder', { orders, userID, user });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};



module.exports = {
    placeOrder,
    orderSuccess,
    displayorder,
    displayOrderDetails,
    updateOrderStatus,
    getOrder,
    getViewOrder,
    createOrder,
    paymentsuccess ,

};
