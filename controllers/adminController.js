const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("../models/userModel");

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

const getAdminDash = async (req, res) => {
  try {
    res.render("admin/adminDash");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("sever error");
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

module.exports = {
  loadLogin,
  verifyUser,
  getAdminDash,
  displayUser,
  unblockUser,
  adminLogout,
};
