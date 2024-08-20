const Cart=require('../models/cartModel')
const Product=require('../models/productModel')
const Address=require('../models/addressModel')
const Category=require('../models/categoryModel')
const User = require("../models/userModel");
const flash = require('connect-flash');
const Offer=require('../models/offerModel');



const getCart = async (req, res) => {
    try {
        const userID = req.session.user;
       
        const usersCart = await Cart.findOne({ user: userID }).populate('items.productID');
        
        
        if (!usersCart || usersCart.items.length === 0) {
            res.render('user/cart', { userID, cartItems: [] });
        } else {
            
            // Iterate through each item in the cart
        for (const item of usersCart.items) {
            // Define originalPrice for each item
            const originalPrice = item.productID.price.salesPrice;

            // Fetch product offer
            const productOffer = await Offer.findOne({ "productOffer.product": item.productID._id, "productOffer.offerStatus": true });

            // Fetch category offer
            const categoryOffer = await Offer.findOne({ "categoryOffer.category": item.productID.category, "categoryOffer.offerStatus": true });

            // Determine applicable offer (use the one with the highest discount)
            let applicableOffer = null;
            if (productOffer && categoryOffer) {
                applicableOffer = productOffer.productOffer.discount > categoryOffer.categoryOffer.discount ? productOffer.productOffer : categoryOffer.categoryOffer;
            } else if (productOffer) {
                applicableOffer = productOffer.productOffer;
            } else if (categoryOffer) {
                applicableOffer = categoryOffer.categoryOffer;
            }

            // Calculate discounted price if applicable offer exists
            if (applicableOffer) {
                const discountedPrice = (originalPrice * (1 - applicableOffer.discount / 100)).toFixed(2);
                item.discountedPrice = discountedPrice;
                item.applicableOffer = applicableOffer;
            } else {
                // Use original price if no applicable offer
                item.discountedPrice = originalPrice;
            }
        }

        // Render the cart template with updated cart items
        res.render('user/cart', { userID, cartItems: usersCart.items });

        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};



const addCart = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            return res.status(401).json({ message: 'AuthenticationError' });
        }

        const { productID, quantity, color } = req.body;
        const product = await Product.findOne({ _id: productID });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (!product.color || !product.color[color]) {
            return res.status(404).json({ success: false, message: 'Color not found for the product' });
        }

        if (product.color[color].quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Not enough stock available' });
        }

        let userCart = await Cart.findOne({ user: userID });

        if (!userCart) {
            // Create a new cart if it doesn't exist
            userCart = new Cart({
                user: userID,
                items: [],
                totalPrice: 0,
            });
        }

        const existingCartItem = userCart.items.find(item => item.productID.equals(productID) && item.color === color);
        if (existingCartItem) {
            return res.status(200).json({ success: false, message: 'Item already in the cart' });
        }

        // Define originalPrice for the product
        const originalPrice = product.price.salesPrice;
        console.log('originalPrice',originalPrice)

        // Fetch product offer
        const productOffer = await Offer.findOne({ "productOffer.product": productID, "productOffer.offerStatus": true });

        // Fetch category offer
        const categoryOffer = await Offer.findOne({ "categoryOffer.category": product.category, "categoryOffer.offerStatus": true });

        // Determine applicable offer (use the one with the highest discount)
        let applicableOffer = null;
        if (productOffer && categoryOffer) {
            applicableOffer = productOffer.productOffer.discount > categoryOffer.categoryOffer.discount ? productOffer.productOffer : categoryOffer.categoryOffer;
        } else if (productOffer) {
            applicableOffer = productOffer.productOffer;
        } else if (categoryOffer) {
            applicableOffer = categoryOffer.categoryOffer;
        }

        // Calculate discounted price if applicable offer exists
        let price = originalPrice;
        let discountedPrice = originalPrice; // Initialize discountedPrice with originalPrice
        if (applicableOffer) {
            discountedPrice = (originalPrice * (1 - applicableOffer.discount / 100)).toFixed(2);
            price = discountedPrice; // Update price to discountedPrice if an offer exists
        }
        console.log('discounted', discountedPrice);

        // Calculate total price for the given quantity
        const totalPriceForItem = price * quantity;
        console.log('totalPriceForItem',totalPriceForItem)
        console.log('totalPrice', totalPriceForItem);

        // Add a new item to the cart
        userCart.items.push({
            productID: productID,
            quantity,
            price: totalPriceForItem, // Storing total price for item considering quantity
            color,
            discountedPrice: price, // Storing discounted price for single unit
            applicableOffer
        });
        userCart.totalPrice += parseFloat(totalPriceForItem); // Ensure totalPriceForItem is a number
        console.log(';; userCart.totalPrice;;')
        await userCart.save();

        // Decrease the product quantity
        product.color[color].quantity -= quantity;
        await product.save();

        return res.status(200).json({ success: true, message: 'Item added to the cart' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




const getStock= async (req, res) => {
    try {
        const productId = req.body.productId;
        const color = req.body.color;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const stock = product.color[color].quantity;
        res.status(200).json({ stock: stock });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeCartItem = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            req.flash('errorMessage', 'Authentication error');
            return res.redirect('/cart');
        }

        const { productID, color } = req.body;

        let userCart = await Cart.findOne({ user: userID });

        if (!userCart) {
            req.flash('errorMessage', 'Cart not found');
            return res.redirect('/cart');
        }

        const itemIndex = userCart.items.findIndex(item => item.productID.equals(productID) && item.color === color);
        
        if (itemIndex === -1) {
            req.flash('errorMessage', 'Item not found in cart');
            return res.redirect('/cart');
        }

        // Remove the item from the cart
        const item = userCart.items[itemIndex];
        userCart.totalPrice -= item.price;
        userCart.items.splice(itemIndex, 1);

        // Save the cart first to ensure consistency
        await userCart.save();

        // Find the product in the database
        const product = await Product.findById(productID);

        if (!product || !product.color || !product.color[color]) {
            req.flash('errorMessage', 'Product or color not found');
            return res.redirect('/cart');
        }

        // Increment the product quantity in the database
        product.color[color].quantity += item.quantity;
        await product.save();

        return res.redirect('/cart');
    } catch (error) {
        console.error(error.message);
        req.flash('errorMessage', 'Internal server error');
        return res.redirect('/cart');
    }
};

const incrementProduct = async (req, res) => {
    try {
        const { productID, color } = req.body;

        // Find the cart for the current user
        const cart = await Cart.findOne({ user: req.session.user });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        // Find the item in the cart
        const item = cart.items.find(item => item.productID.toString() === productID && item.color === color);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the cart.' });
        }

        // Get the product information
        const product = await Product.findById(productID);

        if (!product || !product.color || !product.color[color]) {
            return res.status(404).json({ success: false, message: 'Product or color not found.' });
        }

        // Check if the available stock is 1 or less
        if (product.color[color].quantity <= 0) {
            return res.status(400).json({ success: false, message: 'No more stock available for the selected color.' });
        }

        // Define originalPrice for the product
        const originalPrice = product.price.salesPrice;

        // Fetch product offer
        const productOffer = await Offer.findOne({ "productOffer.product": productID, "productOffer.offerStatus": true });

        // Fetch category offer
        const categoryOffer = await Offer.findOne({ "categoryOffer.category": product.category, "categoryOffer.offerStatus": true });

        // Determine applicable offer (use the one with the highest discount)
        let applicableOffer = null;
        if (productOffer && categoryOffer) {
            applicableOffer = productOffer.productOffer.discount > categoryOffer.categoryOffer.discount ? productOffer.productOffer : categoryOffer.categoryOffer;
        } else if (productOffer) {
            applicableOffer = productOffer.productOffer;
        } else if (categoryOffer) {
            applicableOffer = categoryOffer.categoryOffer;
        }

        // Calculate discounted price if applicable offer exists
        let price = originalPrice;
        if (applicableOffer) {
            price = (originalPrice * (1 - applicableOffer.discount / 100)).toFixed(2);
        }

        // Increment the quantity and update the item price considering the discount
        item.quantity++;
        item.price = (price * item.quantity).toFixed(2); // Storing total price for item considering quantity

        // Update the cart's total price
        cart.totalPrice += parseFloat(price);

        // Decrease the product quantity
        product.color[color].quantity--;
        await product.save();

        // Save the cart
        await cart.save();

        return res.status(200).json({ success: true, message: 'Item quantity incremented.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


const decrementProduct = async (req, res) => {
    try {
        const { productID, color } = req.body;

        // Find the cart for the current user
        const cart = await Cart.findOne({ user: req.session.user });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        // Find the item in the cart
        const item = cart.items.find(item => item.productID.toString() === productID && item.color === color);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the cart.' });
        }

        // Check if the quantity is less than or equal to 1
        if (item.quantity <= 1) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1.' });
        }

        // Define originalPrice for the product
        console.log('--originalprice--',item.price)
        const originalPrice = item.price / item.quantity;
        console.log('<<originalprice>>',originalPrice)

        // Fetch product offer
        // const productOffer = await Offer.findOne({ "productOffer.product": productID, "productOffer.offerStatus": true });

        // // Fetch category offer
        // const categoryOffer = await Offer.findOne({ "categoryOffer.category": item.category, "categoryOffer.offerStatus": true });

        // // Determine applicable offer (use the one with the highest discount)
        // let applicableOffer = null;
        // if (productOffer && categoryOffer) {
        //     applicableOffer = productOffer.productOffer.discount > categoryOffer.categoryOffer.discount ? productOffer.productOffer : categoryOffer.categoryOffer;
        // } else if (productOffer) {
        //     applicableOffer = productOffer.productOffer;
        // } else if (categoryOffer) {
        //     applicableOffer = categoryOffer.categoryOffer;
        // }

        // Calculate discounted price if applicable offer exists
        let price = originalPrice;
        console.log('<<price>>',price)

        // if (applicableOffer) {
        //     price = (originalPrice * (1 - applicableOffer.discount / 100)).toFixed(2);
        // }
        // console.log('price--',price)

        // Decrement the quantity and update the item price considering the discount
        item.quantity--;
        console.log('..price..',price)
        console.log('..priceq..',item.quantity)
        item.price = (price * item.quantity).toFixed(2); // Storing total price for item considering quantity
        console.log('itemprice',item.price)
         console.log('--totalprice--',cart.totalPrice)
         console.log('--totalprice--',price)

        // Update the cart's total price
        cart.totalPrice -= parseFloat(price);
        console.log('cart.totalPrice',cart.totalPrice)

        // Save the cart
        await cart.save();

        // Increase the product quantity
        const product = await Product.findById(productID);
        if (product && product.color && product.color[color]) {
            product.color[color].quantity++;
            await product.save();
        }

        return res.status(200).json({ success: true, message: 'Item quantity decremented.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
const getCartDetails = async (req, res) => {
    try {
        const userID = req.session.user;
        if (!userID) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const cart = await Cart.findOne({ userID: userID }); // Find the cart by user ID
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        res.json({
            success: true,
            discountAmount: cart.discountAmount || 0,
            discountedTotal: cart.discountedTotal || cart.totalPrice,
            subTotal: cart.totalPrice,
            appliedCoupon: cart.appliedCoupon || null,
            message: 'Cart details fetched successfully'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while fetching cart details.' });
    }
};



module.exports={
    getCart,
    addCart,
    getStock,
    removeCartItem,
    incrementProduct,
    decrementProduct,
    getCartDetails, 
}