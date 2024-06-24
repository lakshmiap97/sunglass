const Wishlist = require('../models/wishlistModel')
const User = require('../models/userModel')
const Product = require('../models/productModel') 


const displayWishlist = async(req,res)=>{
    try {
        const userID = req.session.user
        const wishlist = await Wishlist.findOne({user:userID}).populate('items.product')
        console.log('..>>',wishlist.items)
        if(wishlist == null){
            res.render('user/wishlist',{userID})
        }else{
        res.render('user/wishlist',{userID,wishlist})
    }
    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async(req,res)=>{
    try {
        const userID = req.session.user
        const pid = req.body.productID
        const wproduct = await Product.findOne({_id:pid})
        const wishlist = await Wishlist.findOne({user:userID})
        if(wishlist){
            const itemAlreadyExist = wishlist.items.findIndex((item)=>item.product == pid)
            if (itemAlreadyExist === -1) {
                wishlist.items.push({
                    product:pid
                })
                await wishlist.save()  
            }
        }else{
            const newWishlist = new Wishlist({
                user:userID,
                items:[{
                    product:pid
                }]
            })
            await newWishlist.save()
        }
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}

const removeWishlist = async(req,res)=>{
    try {
        const pid = req.body.productID
        const userID = req.session.user
        const wishlist = await Wishlist.updateOne({user:userID},{$pull:{items:{product:pid}}})
        console.log(wishlist)
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    displayWishlist,
    addToWishlist,
    removeWishlist
}