const mongoose = require('mongoose'); 
const { ObjectId } = mongoose.Types; 
const Order = require('../models/orderModel');
const User = require("../models/userModel");
const Product = require('../models/productModel');
const Address = require("../models/addressModel");
const Cart = require('../models/cartModel');
const Razorpay=require('razorpay')
const Wallet=require('../models/walletModel')

const  generateOtp = require('../controllers/otpController/generateOTP')
const razorpay=new Razorpay({
    key_id:'rzp_test_8oA5wZD2fGxjcW',
    key_secret:'fX9soMFss7DEe30ldooZGorC'
})


const createOrder = async (req, res) => {
    try {
        console.log('getting hereeee')
        const qwerty=req.body
        console.log('qwerty',qwerty)
       
        const amount = parseInt(req.body.totalPrice);
        const address= req.body.addressID;
         // Check if addressID is present
         if (!address) {
            return res.status(400).json({ error: 'Address ID is required' });
        }
        console.log("<<amount>>..",amount)
        const order = await razorpay.orders.create({
            amount: amount * 100, // Amount in smallest currency unit
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });
        console.log('the order is',order)
        res.json({ orderID: order });
        
    } catch (error) {
        console.error('the error is',error.message);
        res.status(500).send('Server Error');
    }
};


const paymentsuccess = async (req, res) => {
    try {
        const { paymentid, razorpayorderid, signature, orderid } = req.body;
        console.log(req.body)
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
        console.log("placeordrer ");
        const userID = req.session.user;
        console.log("userID", userID);
        if (!userID) {
            return res.status(401).send('User not logged in');
        }

        const user = await User.findById(userID);
        const { cartID, totalPrice, paymentMethod, productsID, addressID } = req.body;
        console.log('totalPrice>>..',totalPrice)

        if (!addressID) {
            return res.status(400).json({ success: false, message: 'Address is required to place an order' });
        }
        console.log('Request Body:', req.body); 
        console.log('Payment Method:', paymentMethod); 
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
       

           // Check if payment method is COD and totalPrice > 1000
           if (paymentMethod === 'cash' && totalPrice > 1000) {
            return res.status(400).json({ success: false, message: 'COD not available for orders over 1000' });
            return; // Add this line to end the function execution
          }

        // Check if payment method is wallet
        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: userID });

            if (!wallet || wallet.balance < totalPrice) {
                return res.status(400).send('Insufficient wallet balance');
            }

            // Deduct the total amount from the wallet balance
            wallet.balance -= totalPrice;
            wallet.walletdata.push({
                history: -totalPrice,
                date: new Date(),
                paymentmethod: "wallet",
                transactionID: generateOtp()
            });

            await wallet.save();
        }

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

        const savedOrder = await newOrder.save();
        console.log('neworder', newOrder);
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
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    try {
        const userID = req.session.user;
        
        
        const order = await Order.find({})
            .limit(limit)
            .skip(skip).sort({createdAt: -1 })
            // .collation({ locale: 'en', strength: 2 })
            // .exec();

        
        const totalorders = await Order.countDocuments({});
        const totalpage = Math.ceil(totalorders / limit);

        // Logging orders for debugging
        console.log('Fetched Orders:', order);

        
        res.render('admin/orderlist', { order: order, userID: userID, totalpage: totalpage, totalorders: totalorders, currentpage: page });
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
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;
    try {
        const userID = req.session.user;
        if (!userID) {
            throw new Error('User not logged in');
        }

        const user = await User.findById(userID);
        if (!user) {
            throw new Error('User not found');
        }

        const orders =  await Order.find({ user: userID }) .limit(limit).sort({createdAt: -1 })
        .skip(skip).populate('products.product')
        
        // .collation({ locale: 'en', strength: 2 })
        // .exec();

    
    const totalorders = await Order.countDocuments({user: userID});
    const totalpage = Math.ceil(totalorders / limit);


        // const orders = await Order.find({ user: userID }).populate('products.product');
        console.log('>>order>>',orders)
        res.render('user/order', { orders:orders, userID:userID, user:user, totalpage: totalpage, totalorders: totalorders, currentpage: page });
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
        const cartID = orders.cartID; 

        res.render('user/viewOrder', { orders, userID, user, cartID  });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const usercancelOrder = async(req,res)=>{
    try {
        const user = req.session.user
        const orderID = req.body.orderID
        console.log('user',user)
        console.log('orderID',orderID)
        const corder = await Order.findByIdAndUpdate({_id:orderID},
            {$set:{
                status:"Cancelled"
            }})
            let productArray = []
            corder.products.forEach(element =>{
                let prodata = {
                    productID:element.product,
                    quantity:element.quantity,
                    color:element.color
                }
                productArray.push(prodata)
            })
            productArray.forEach(async(el)=>{
                await Product.findByIdAndUpdate({_id:el.productID},{$inc:{[`color.${el.color}.quantity`]:el.quantity}})
            })
            console.log('productArray',productArray)
            console.log('corder',corder)
            if(corder.paymentmethod === 'razorpay'){
                const wallet = await Wallet.findOne({user:user})
                console.log('wallet',wallet)
                if(wallet){

                    await Wallet.findOneAndUpdate({user:user},
                        {
                            $push:
                            {walletdata:{
                                history:corder.totalamount,
                                date:new Date(),
                                paymentmethod:"razorpay",
                                transactionID:generateOtp()
                            }
                        },
                        $inc:{balance:corder.totalamount}})
                }
                console.log('wallet',wallet)
            }
            res.status(200).json({success:true})
    } catch (error) {            
        console.log(error.message);
    }
}



const returnOrder = async(req,res)=>{
    try {
        const orderID = req.body.orderID
        console.log('orderID',orderID)
        const order = await Order.findByIdAndUpdate({_id:orderID},
            {$set:{
                status:"Return Processing"
            }})
            console.log('order>><<',order)

        if(order.status ==="Returned"){
            let productArray = []
            order.products.forEach(element =>{
                let prodata = {
                    productID:element.productID,
                    quantity:element.quantity,
                    color:element.color
                }
                productArray.push(prodata)
            })
            console.log('the product array is ',productArray);
            productArray.forEach(async(el)=>{
                 await Product.findByIdAndUpdate({_id:el.productID},{$inc:{[`size.${el.color}.quantity`]:el.quantity}})
            })
        }
        res.status(200).json({succes:true})

    } catch (error) {
        console.log(error.message);
    }
}

const cancelReturn = async(req,res)=>{
    try {
        const orderID = req.body.orderID
        const order = await Order.findByIdAndUpdate({_id:orderID},{$set:{status:"Delivered"}})
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}

const paymentfailed = async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const user = req.session.user;
        const userData = await User.findById(user);
        const cartID = req.body.cartID;
        const AddressID = req.body.addressID;

        // Find the main address document by user ID
        const mainAddressDoc = await Address.findOne({ 'addresses._id': AddressID });

        if (!mainAddressDoc) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // Extract the specific address from the addresses array
        const uaddress = mainAddressDoc.addresses.id(AddressID);

        const price = req.body.totalPrice;
        const coupon = req.body.coupon;
        const paymentMethod = req.body.paymentMethod;
      
        console.log('User:', user);
        console.log('UserData:', userData);
        console.log('CartID:', cartID);
        console.log('AddressID:', AddressID);
        console.log('Address:', uaddress);
        console.log('Price:', price);
        console.log('PaymentMethod:', paymentMethod);

        if (!userData || !cartID || !uaddress || !price || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const cart = await Cart.findById(cartID).populate('items.productID');
        const cproduct = cart.items.map((item) => ({
            product: item.productID._id,
            color: item.color,
            quantity: item.quantity,
            amount: item.productID.price.salesPrice * item.quantity
        }));

        console.log('Cart:', cart);
        console.log('CProduct:', cproduct);

        const date = new Date().toISOString().split('T')[0];
        const order = new Order({
            user: userData._id,
            address: {
                name: uaddress.name,
                mobile: uaddress.mobile,
                pincode: uaddress.pincode,
                locality: uaddress.locality,
                Address: uaddress.Address,
                city: uaddress.city,
                state: uaddress.state,
                country: uaddress.country
            },
            products: cproduct,
            coupon: coupon,
            totalamount: price,
            paymentmethod: paymentMethod,
            date: date,
            status: "Payment Failed"
        });
        
        const myorder = await order.save();
        console.log('Order saved:', myorder);
        res.status(200).json({ success: true, id: myorder._id });

    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).send('Server Error');
    }
};

const payAgain = async (req, res) => {
    try {
        const orderId = req.body.id;
        const orders = await Order.findById(orderId);
        console.log('orderpay',orders)

        if (!orders) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: orders.totalamount * 100, // Amount in smallest currency unit
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });
        console.log('razor',razorpayOrder)
        // Save Razorpay order ID in the order document
        orders.razorpayOrderId = razorpayOrder.id;
        await orders.save();

        res.json({ orderID: razorpayOrder });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

       
const successPayment = async (req, res) => {
    try {
        const user = req.session.user;
        const { response, orderId, cartID } = req.body; // Ensure cartID is included
        console.log('</cart/>',cartID)

        console.log('Request body:', req.body);

        // Validate response object
        if (!response || !response.razorpay_payment_id || !response.razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid response data' });
        }

        const { createHmac } = require('crypto');

        // Create hash to verify the payment
        const hash = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + response.razorpay_payment_id)
            .digest('hex');

        if (hash === response.razorpay_signature) {
            // Update order status to "Confirmed"
            const updatedOrder = await Order.findOneAndUpdate(
                { razorpayOrderId: orderId },
                { $set: { status: "Confirmed" } },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Retrieve the updated order details
            const myorder = await Order.findOne({ razorpayOrderId: orderId }).populate('products.product');

            // Process each product in the order
            for (let item of myorder.products) {
                const product = item.product;
                const selectedColor = item.color;
                const quantityToDeduct = item.quantity;

                if (!product.color[selectedColor] || product.color[selectedColor].quantity < quantityToDeduct) {
                    return res.status(200).json({ success: false, message: 'Out of Stock' });
                }

                // Deduct the ordered quantity from the available stock
                product.color[selectedColor].quantity -= quantityToDeduct;
                product.totalQuantity -= quantityToDeduct;

                // Save the updated product document
                await product.save();
            }

            // Fetch and delete the user's cart
            if (cartID) {
                const cart = await Cart.findByIdAndDelete(cartID); // Use cartID from request
                if (!cart) {
                    console.error('Cart not found');
                } else {
                    console.log('Cart deleted:', cart);
                }
            } else {
                console.error('Cart ID is missing');
            }

            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

    } catch (error) {
        console.error('Error processing payment:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
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
    usercancelOrder,
    returnOrder,
    cancelReturn,
    paymentfailed,
    payAgain,
    successPayment,
};
