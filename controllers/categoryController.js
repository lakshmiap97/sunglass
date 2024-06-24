const Category = require("../models/categoryModel");

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
  const categoryOffer = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('admin/categoryOffer',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const getCategoryOffer = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('admin/addCategoryOffer',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const postCategoryOffer = async(req,res)=>{
    try {
        const {name,discount,startdate,enddate} = req.body
        console.log(req.body);
        const category = await Category.findOne({name:name})
        console.log(category);
        const offerdata = {
            discount:discount,
            startDate:startdate,
            endDate:enddate
        }

        console.log('the offer data is',offerdata);
        const categoryOffer = await Category.findByIdAndUpdate({_id:category._id},{
            $set:{
                offer:offerdata
            }
        })

        res.redirect("/admin/categoryOffer")

    } catch (error) {
        console.log(error.message);
    }
}

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

}