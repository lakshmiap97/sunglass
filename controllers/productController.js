const Product=require('../models/productModel')
const Category=require('../models/categoryModel') 
const fs = require('fs');
const path = require("path");
const mongoose = require('mongoose'); 
const { ObjectId } = mongoose.Types; 

const displayProduct=async(req,res)=>{
    console.log("hii");
    const searchquery=req.query.search||"";
    const page=parseInt(req.query.page)||1
    const limit=3
    const skip=(page-1)*limit
    try {
        const query = {
            // isActive:true,
            $or: [
                {
                    name: { $regex: new RegExp(searchquery, "i") },
                   
                },
            ],
        };


        const product=await Product.find(query).skip(skip).limit(limit).populate('category');
        const totalproducts=await Product.countDocuments(query)
        const totalpage=Math.ceil(totalproducts/limit)
        res.render('admin/products',{product:product,totalpage:totalpage,currentpage:page,totalproducts:totalproducts})
        
    } catch (error) {
        console.log(error.message);  
        res.status(500).send('sever error')
    }
}



const displayAddProduct = async(req,res)=>{
    try {
        const category=await Category.find({isActive:true})
        const product=await Product.find({})
        res.render('admin/addProduct',{product,category})
    
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req, res) => {
    try {
        const { name, description, salesPrice, regularPrice, category , black, blue,red,green,yellow} = req.body;
        const images = req.files;
        const imageFile = images.map(image => image.filename);

        const defaultQuantities = {
            black: 0,   // Default quantity for black
            blue: 0,    // Default quantity for blue
            red: 0,     // Default quantity for red
            green: 0,   // Default quantity for green
            yellow: 0   // Default quantity for yellow
        };
        const totalQuantity = (parseInt(black) || defaultQuantities.black) +
        (parseInt(blue) || defaultQuantities.blue) +
        (parseInt(red) || defaultQuantities.red) +
        (parseInt(green) || defaultQuantities.green) +
        (parseInt(yellow) || defaultQuantities.yellow);


        // Create new Product instance with validated data
        const product = new Product({
            name:name,
            description:description,
            price: {
                salesPrice: salesPrice,
                regularPrice: regularPrice,
            },
            category:category,
            image: imageFile,
            color:{
               black:{
                quantity: black|| defaultQuantities.black,
               },
               blue:{
                quantity:blue|| defaultQuantities.blue,
               },
               red:{
                quantity:red|| defaultQuantities.red,
               },
               yellow:{
                quantity:yellow|| defaultQuantities.yellow,
               },
               green:{
                quantity:green|| defaultQuantities.green,
               },
            },
            totalQuantity: totalQuantity // Add totalQuantity field
        });

        // Save the product to the database
        const savedProduct = await product.save();
        res.redirect('/product');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};
      const editProduct = async(req,res)=>{
        try {
            const pid = req.query._id
            req.session.pid=pid
            
            const product = await Product.findOne({_id:pid}).populate('category')
            const category = await Category.find({})
            res.render('admin/editProduct',{product,category})
        } catch (error) {
            console.log(error.message);
            res.status(500).send('sever error')
        }
    }

    const postEditProduct = async (req, res) => {
        try {
            const pid = req.session.pid;
            const images = req.files;
            const imageFile = images.map(image => image.filename);
            const { name, description, salesPrice, regularPrice, category } = req.body;
    
            const colorQuantities = {
                black: { quantity: parseInt(req.body['color.black.quantity']) || 0 },
                blue: { quantity: parseInt(req.body['color.blue.quantity']) || 0 },
                red: { quantity: parseInt(req.body['color.red.quantity']) || 0 },
                green: { quantity: parseInt(req.body['color.green.quantity']) || 0 },
                yellow: { quantity: parseInt(req.body['color.yellow.quantity']) || 0 }
            };

            const totalQuantity = colorQuantities.black.quantity +
            colorQuantities.blue.quantity +
            colorQuantities.red.quantity +
            colorQuantities.green.quantity +
            colorQuantities.yellow.quantity;
           
            const updateObject = {
                name: name,
                description: description,
                price: {
                    salesPrice: salesPrice,
                    regularPrice: regularPrice
                },
                color: colorQuantities,
                category: category,
                totalQuantity: totalQuantity // Add totalQuantity field
            };
    
           
            if (imageFile.length > 0) {
                updateObject.image = imageFile;
            }
    
            const updatedProduct = await Product.findByIdAndUpdate(
                pid,
                { $set: updateObject },
                { new: true }
            );
    
            if (!updatedProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
    
            res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    };
    


    const blockProduct = async(req,res)=>{
        try {
            const id = req.query._id
            const product = await Product.findById({_id:id})
            if (product.isActive==true) {
                await Product.findOneAndUpdate({_id:id},{$set:{isActive:false}})
            } else {
                await Product.findOneAndUpdate({_id:id},{$set:{isActive:true}})
            }
            res.redirect('/product')
        } catch (error) {
            console.log(error.message);
            res.status(500).send('sever error')
        }
    }
    const deleteImage = async (req, res) => {
        const { productId, imageIndex } = req.body;

    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    try {
      
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

       
        if (imageIndex >= 0 && imageIndex < product.image.length) {
            product.image.splice(imageIndex, 1);
            await product.save();
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid image index' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
    };
    //-------------------USER SIDE
    const getAllProducts=async(req,res)=>{
        try {
            const products=await Product.find();
            return products;
            
        } catch (error) {
            res.status(500).json({message:err.message})
        }
    }

    const getAProduct = async (productId) => {
        try {
            const result = await Product.findById(productId);
            return result;
        } catch (error) {
            console.log(error);
            throw error; // Re-throw the error if needed
        }
    };

    const productofferLoad = async (req, res) => {
        try {
            const product = await Product.find({});
            res.render("admin/productOffer", { product });
        } catch (error) {
            console.log(error);
            res.status(500).send('Server error');
        }
    };
    
    

   
   
module.exports={
    displayProduct,
    displayAddProduct,
    addProduct,
    editProduct,
    postEditProduct,
    blockProduct,
    deleteImage,
    getAllProducts,
    getAProduct,
    productofferLoad
}