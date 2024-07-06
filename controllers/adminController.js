const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("../models/userModel");
const Order = require('../models/orderModel');
const moment = require('moment');
const Product = require('../models/productModel');
const Category = require("../models/categoryModel");

const loadLogin = async (req, res) => {
  try {
    res.render("admin/login", { message: "" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
  }
};

const verifyUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });
    console.log(userData);
    if (userData) {
      const passwordmat = await bcrypt.compare(password, userData.password);
      if (passwordmat) {
        if (userData.is_admin === 0) {
          res.render("admin/login", { message: "Invalid Admin" });
        } else {
          req.session.admin_id = userData._id;
          res.render("admin/adminDash");
        }
      } else {
        res.render("admin/login", { message: "Invalid Admin" });
      }
    } else {
      res.render("admin/login", { message: "Invalid Admin" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
  }
};

const fetchMonthlySales = async (req, res) => {

  const monthlySales = Array.from({ length: 12 }, () => 0);
  const orders = await Order.find({ status: "Delivered" });
  for (const order of orders) {
      const month = order.createdAt.getMonth();
      monthlySales[month] += order.totalamount;
  }
  res.json({ monthlySales })
};

const fetchYearlySales = async (req, res) => {
  try {
      const START_YEAR = 2022;
      const currentYear = new Date().getFullYear();
      const yearlySales = Array.from({ length: currentYear - START_YEAR + 1 }, () => 0); 


      const orders = await Order.find({ status: "Delivered" });


      for (const order of orders) {
          const year = order.createdAt.getFullYear();
          yearlySales[year - START_YEAR] += order.totalamount;
      }

      res.json({ yearlySales, START_YEAR })
  } catch (error) {
      console.log(error);
      throw error;
  }
};


const getAdminDash = async (req, res) => {
  try {
      const order = await Order.find({ status: "Delivered" }).populate('products.product');
      let revenue = 0
      order.forEach(element=>{
          amount = element.totalamount
          revenue+=amount
      })
      const totalOrder = await Order.find({}).count()
      const bestSellingProducts = await Order.aggregate([
          { $unwind: "$products" },

          {
              $group: {
                  _id: "$products.product",
                  totalQuantity: { $sum: "$products.quantity" }
              }
          },
          { $sort: { totalQuantity: -1 } },
          { $limit: 4 }
      ]);

      let topProductDetails = [];

      if (bestSellingProducts.length > 0) {
          for (const product of bestSellingProducts) {
              const productDetails = await Product.findById(product._id);
              topProductDetails.push({
                  product: productDetails,
                  totalQuantity: product.totalQuantity
              });
          }
      }
      console.log(topProductDetails);


      const totalDeliveredProducts = await Order.aggregate([

          {
              $group: {
                  _id: null, 
                  totalProducts: { $sum: { $size: "$products" } } 
              }
          }
      ]);

      let totalProducts = 0;

      if (totalDeliveredProducts.length > 0) {
          totalProducts = totalDeliveredProducts[0].totalProducts;
      }



      const categoryCounts = await Order.aggregate([
          { $match: { status: 'Delivered' } },
          { $unwind: "$products" },
          { $lookup: { from: 'products', localField: 'products.product', foreignField: '_id', as: 'productDetails' } },
          { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } }, 
          { $lookup: { from: 'categories', localField: 'productDetails.category', foreignField: '_id', as: 'categoryDetails' } },
          { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
          { $group: { _id: "$categoryDetails.name", count: { $sum: { $ifNull: ["$products.quantity", 0] } } } }
      ]);
      console.log(categoryCounts);        

      const category = await Category.find({})

      const categoryNames = [];
      const categoryCountsMap = {};


      category.forEach(cat => {
          categoryNames.push(cat.name);
      });


      categoryNames.forEach(catName => {
          categoryCountsMap[catName] = 0;
      });


      categoryCounts.forEach(catCount => {
          const categoryName = catCount._id;
          categoryCountsMap[categoryName] = catCount.count;
      });


      const categoryData = categoryNames.map(catName => categoryCountsMap[catName]);



      const catnames = JSON.stringify(categoryNames)
      res.render("admin/adminDash", { topProductDetails, categoryData,categoryNames,revenue,totalOrder,totalProducts});
  } catch (error) {
      console.log(error.message);
  }
};
const displayUser = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 3;
    const query = {
      is_admin: "0",
      $or: [
        {
          name: { $regex: new RegExp(search, "i") },
        },
      ],
    };
    const userData = await User.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const count = await User.countDocuments(query);
    const totalpage = Math.ceil(count / limit);
    res.render("admin/userList", {
      user: userData,
      totalpage: totalpage,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
  }
};

const unblockUser = async (req, res) => {
  try {
    const userData = req.query._id;
    const user = await User.findOne({ _id: userData });
    if (user.isActive == true) {
      await User.updateOne({ _id: userData }, { $set: { isActive: false } });
    } else {
      await User.updateOne({ _id: userData }, { $set: { isActive: true } });
    }

    res.redirect("/userList");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
  }
};
const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
  }
};


const getSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({status:"Delivered"}).populate('products.product').sort({_id:-1})  .populate({
          path: 'user',
          select: 'email _id' // Select both the email and _id fields from the User model
      })
        console.log("the order is",orders);
        res.render('admin/salesReport', { orders })
    } catch (error) {
        console.log(error.message);
    }
}

const customDate = async (req, res) => {
  try {
    const { value: date, value2: date2 } = req.query;

    console.log(`Received dates: ${date}, ${date2}`);
    // Ensure both dates are provided
    if (!date || !date2) {
        throw new Error('Both start date and end date must be provided');
    }

    const startDate = new Date(date);
    const endDate = new Date(date2);

    console.log(`Parsed dates: ${startDate}, ${endDate}`);


     // Check if dates are valid
     if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
  }

    // Ensure startDate is before endDate
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
  }


  const orders = await Order.find({
    status: "Delivered",
    date: { $gte: startDate, $lte: endDate },
  }).populate('products.product').populate('user', 'email _id');

    console.log('Found orders:', orders);


    res.render("admin/salesReport", { orders });
  } catch (error) {
    console.error(error.message);
    res.status(400).send(error.message);
  }
};


const filterDate = async (req, res) => {
  try {
      const sort = req.query.value.trim();
      console.log('sort:', sort);

      let orderDateQuery = {};

      const currentDate = new Date();
      console.log('Current Date:', currentDate);

      const startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      console.log('Start Date of Today:', startDate);

      if (sort === "Day") {
          orderDateQuery = {
              $gte: startDate,
              $lte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1) // End of current day
          };
      } else if (sort === "Week") {
          const firstDayOfWeek = new Date(currentDate);
          firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);

          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          lastDayOfWeek.setHours(23, 59, 59, 999);

          console.log('First Day of Week:', firstDayOfWeek);
          console.log('Last Day of Week:', lastDayOfWeek);

          orderDateQuery = {
              $gte: firstDayOfWeek,
              $lte: lastDayOfWeek
          };
      } else if (sort === "Month") {
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          firstDayOfMonth.setHours(0, 0, 0, 0);

          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          lastDayOfMonth.setHours(23, 59, 59, 999);

          console.log('First Day of Month:', firstDayOfMonth);
          console.log('Last Day of Month:', lastDayOfMonth);

          orderDateQuery = {
              $gte: firstDayOfMonth,
              $lte: lastDayOfMonth
          };
      } else if (sort === "Year") {
          const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
          firstDayOfYear.setHours(0, 0, 0, 0);

          const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31);
          lastDayOfYear.setHours(23, 59, 59, 999);

          console.log('First Day of Year:', firstDayOfYear);
          console.log('Last Day of Year:', lastDayOfYear);

          orderDateQuery = {
              $gte: firstDayOfYear,
              $lte: lastDayOfYear
          };
      }

      const orders = await Order.find({
          status: { $nin: ["Ordered", "Cancelled", "Shipped"] },
          date: orderDateQuery
      }).populate('products.product').populate('user', 'email _id');

      console.log('Found Orders:', orders);

      res.render("admin/salesReport", { orders });
  } catch (error) {
      console.error('Error:', error.message);
      res.status(400).send(error.message);
  }
};

module.exports = { filterDate };

module.exports = {
  loadLogin,
  verifyUser,
  getAdminDash,
  displayUser,
  unblockUser,
  adminLogout,
  getSalesReport,
  customDate,
  filterDate,
  fetchMonthlySales,
  fetchYearlySales,
};
