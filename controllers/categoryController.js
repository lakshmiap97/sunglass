const Category = require("../models/categoryModel");
const Offer=require('../models/offerModel')
const mongoose = require('mongoose'); 

const displayAddCategory = async (req,res) =>{
    const searchquery=req.query.search||"";
    const page=parseInt(req.query.page)||1
    const limit=3
    // const skip=(page-1)*limit
    try{
        const query = {
            // isActive:true,
            $or: [
                {
                    name: { $regex: new RegExp(searchquery, "i") },
                   
                },
            ],
        };

        const category = await Category.find(query)
        .limit(limit)
        .skip((page-1)*limit)
        .collation({ locale: 'en', strength: 2 })
        .exec()
        const totalcategories=await Category.countDocuments(query)
        const totalpage=Math.ceil(totalcategories/limit)
        res.render('admin/categories',{category:category,totalpage:totalpage,currentpage:page,totalcategories:totalcategories,
        
        });
    }
    catch(error){
        console.log(error.message)
        res.status(500).send('sever error')
    }
}

const postAddCategories = async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryExist = await Category.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
       
        if (categoryExist) {
            const totalcategories = await Category.countDocuments();
            const limit = 3;
            const totalpage = Math.ceil(totalcategories / limit);
            const page = 1;
            const categories = await Category.find({})
                .limit(limit)
                .skip((page - 1) * limit)
                .collation({ locale: 'en', strength: 2 })
                .exec();

            return res.render('admin/categories', { 
                category: categories, 
                totalpage: totalpage, 
                currentpage: page, 
                totalcategories: totalcategories, 
                message: "Category already exists" 
            });
        }

        const newCategory = new Category({
            name: name,
            description: description,
            isActive: true
        });
        
        const savedCategory = await newCategory.save();

        const totalcategories = await Category.countDocuments();
      
        const limit = 3; 
        const totalpage = Math.ceil(totalcategories / limit);

        const page = 1; 
        const categories = await Category.find({})
            .limit(limit)
            .skip((page - 1) * limit)
            .collation({ locale: 'en', strength: 2 })
            .exec();
        
        return res.render('admin/categories', {
            category: categories,
            totalpage: totalpage,
            currentpage: page,
            totalcategories: totalcategories
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}


const blockCategory = async(req,res)=>{
    try {
        console.log('gettig here');
        const id = req.query._id
        const cat = await Category.findOne({_id:id})
        console.log('the category ',cat);
        if (cat.isActive == true) {
            await Category.updateOne({_id:id},{$set:{isActive:false}})
        } else {
            await Category.updateOne({_id:id},{$set:{isActive:true}})
        }
        res.redirect('/categories')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('sever error')
    }
}


const editCategory = async(req,res)=>{

    try {
        const cid = req.query._id
        const category = await Category.findOne({_id:cid})
        res.render('admin/editCategory',{category})
    } catch (error) {
        console.log(error.message);
        res.status(500).send('sever error')
    }

}

const postEditCategory = async (req, res) => {
    try {
        const categoryId = req.body._id;
        const { name, description } = req.body;
        let category = await Category.findOne({ _id: categoryId });
        const catname = name.trim();

        if (catname !== category.name) {
            const ucat = await Category.findOne({ name: catname });

            if (!ucat) {
                category = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { name: catname, description: description } });
                res.redirect("/categories");
            } else {
                res.render('admin/editCategory', { category, message: "Category already exists" });
            }
        } else {
            category = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { name: catname, description: description } });
            res.redirect('/categories');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const getAllcategory = () => {
    return new Promise(async (resolve, reject) => {
      await Category.find().then((result) => {
        resolve(result);
      });
    });
  };
  
  const categoryOffer = async (req, res) => {
    try {
        const category = await Category.find({});
        const catOffers = await Offer.find({'categoryOffer.ref': 'Category', 'categoryOffer.offerStatus': true})
            .populate('categoryOffer.category');
        
        // Log offers to debug
        console.log('Offers:',catOffers);
        
        res.render('admin/categoryOffer', { category, catOffers });
    } catch (error) {
        console.log(error.message);
    }
};


const getCategoryOffer = async (req, res) => {
    try {
        const { categoryId, offerName, discount, startingDate, endingDate } = req.body;
        console.log('category body', req.body);

        // Validate categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        // Validate offerName
        if (!offerName.match(/^[a-zA-Z0-9\s]+$/) || offerName.trim() === "") {
            return res.status(400).json({ success: false, message: 'Invalid offer name' });
        }

        // Validate startingDate and endingDate
        const startDate = new Date(startingDate);
        const endDate = new Date(endingDate);
        const today = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        if (startDate < today) {
            return res.status(400).json({ success: false, message: 'Starting date cannot be in the past' });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ success: false, message: 'Ending date must be after the starting date' });
        }

        // Validate discount value
        const discountValue = parseFloat(discount);
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 99) {
            return res.status(400).json({ success: false, message: 'Discount must be a positive number between 1 and 99' });
        }

        // Check if offerName already exists
        const existingOffer = await Offer.findOne({ offerName: new RegExp(`^${offerName}$`, 'i') });
        if (existingOffer) {
            return res.status(400).json({ success: false, message: 'Offer name already exists' });
        }

        const newOffer = new Offer({
            offerName,
            startingDate,
            endingDate,
            categoryOffer: {
                category: categoryId,
                discount: discountValue,
                offerStatus: true
            },
            status: true
        });

        await newOffer.save();
        console.log('new offer', newOffer);
        res.status(201).json({ success: true, message: 'Category offer added successfully', offer: newOffer });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

const postCategoryOffer = async (req, res) => {
    try {
        const { offerId, categoryId, offerName, discount, startingDate, endingDate } = req.body;

        // Validate offerId
        if (!mongoose.Types.ObjectId.isValid(offerId)) {
            return res.status(400).json({ success: false, message: 'Invalid offer ID' });
        }

        // Validate categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        // Validate offerName
        if (!offerName.match(/^[a-zA-Z0-9\s]+$/) || offerName.trim() === "") {
            return res.status(400).json({ success: false, message: 'Invalid offer name' });
        }

        // Validate startingDate and endingDate
        const startDate = new Date(startingDate);
        const endDate = new Date(endingDate);
        const today = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        if (startDate < today) {
            return res.status(400).json({ success: false, message: 'Starting date cannot be in the past' });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ success: false, message: 'Ending date must be after the starting date' });
        }

        // Validate discount value
        const discountValue = parseFloat(discount);
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 99) {
            return res.status(400).json({ success: false, message: 'Discount must be a positive number between 1 and 99' });
        }

        // Find the existing offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        // Update the offer details
        offer.offerName = offerName;
        offer.startingDate = startingDate;
        offer.endingDate = endingDate;
        offer.categoryOffer.category = categoryId;
        offer.categoryOffer.discount = discountValue;
        offer.categoryOffer.offerStatus = true;
        offer.status = true;

        // Save the updated offer
        await offer.save();
        res.status(201).json({ success: true, message: 'Category offer updated successfully', offer: offer });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};


const deleteExistingOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        await Offer.findByIdAndDelete(offerId);
        return res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    displayAddCategory,
    postAddCategories,
    blockCategory,
    editCategory,
    postEditCategory,
    getAllcategory,
    getCategoryOffer,
    postCategoryOffer,
    categoryOffer,
    deleteExistingOffer,
}