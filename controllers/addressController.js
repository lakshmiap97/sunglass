const User = require("../models/userModel");
const Address = require("../models/addressModel");
const bcrypt = require("bcrypt");

const userProfile = async (req, res) => {
  try {
    const userID = req.session.user;
    const user = await User.findById(userID);
    const addresses = await Address.findOne({ user: userID });
    res.render("user/profile", { user, addresses, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error });
  }
};

const address = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const userID = req.session.user;
    const user = await User.findById(userID);
    const addresses = await Address.findOne({ user: userID }).populate("user");

    res.render("user/address", { addresses, userID, user });
  } catch (error) {
    console.error("Error rendering address page:", error);
    res.status(500).send("Internal Server Error");
  }
};


const getaddAddress = async (req, res) => {
  try {
    const userID = req.session.user;
    const user = await User.findById(userID);
    const addresses = await Address.findOne({ user: userID });
    res.render("user/addAddress", { userID, addresses, user });
  } catch (error) {
    console.error("Error rendering addAddress:", error);
    res.status(500).send("Internal Server Error");
  }
};


const postaddAddress = async (req, res) => {
  try {
    const { name, mobile, pincode, locality, address, city, state, country } = req.body;
    const user = req.session.user;

    if (!user) {
      return res.redirect("/login");
    }

    let userAddress = await Address.findOne({ user });
    if (!userAddress) {
      userAddress = new Address({ user, addresses: [] });
    }

    userAddress.addresses.push({
      name,
      mobile,
      pincode,
      locality,
      address,
      city,
      state,
      country,
    });

    await userAddress.save();
    res.redirect("/address");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("error", { message: "Error adding address." });
  }
};


const editAddress = async (req, res) => {
  try {
    const userID = req.session.user;
    const user = await User.findById(userID);

    const addressId = req.query._id;
    const userAddress = await Address.findOne({ user: userID, "addresses._id": addressId });

    if (!userAddress) {
      return res.status(404).send("Address not found");
    }

    const address = userAddress.addresses.id(addressId);

    res.render("user/editAddress", {
      address,
      userID,
      user,
    });
  } catch (error) {
    console.error("Error rendering editAddress:", error);
    res.status(500).send("Internal Server Error");
  }
};

const postEditAddress = async (req, res) => {
  try {
    const addressId = req.body._id;
    const { name, mobile, address, city, state, pincode, locality, country } = req.body;

    const userAddress = await Address.findOneAndUpdate(
      { "addresses._id": addressId },
      {
        $set: {
          "addresses.$.name": name,
          "addresses.$.mobile": mobile,
          "addresses.$.address": address,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.pincode": pincode,
          "addresses.$.locality": locality,
          "addresses.$.country": country,
        }
      },
      { new: true }
    );

    if (!userAddress) {
      return res.status(404).send("Address not found");
    }

    res.redirect("/address");
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const deleteAddress = async (req, res) => {
  try {
    const addressId = req.body.addressId;

    const userAddress = await Address.findOneAndUpdate(
      { "addresses._id": addressId },
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    if (!userAddress) {
      return res.status(404).send("Address not found");
    }

    res.redirect("/address");
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).send("Internal Server Error");
  }
};


const accountDetails = async (req, res) => {
  try {
    const userID = req.session.user;
    const user = await User.findById(userID);
    const addresses = await Address.findOne({ user: userID });
    res.render("user/accountDetails", { user, addresses, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error", { error });
  }
};


const postAccountDetails = async (req, res) => {
  const { name, mobile, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const userID = req.session.user;
    const user = await User.findById(userID);

    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    if (currentPassword && newPassword && confirmPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).render("user/login", { error: "Current password is incorrect" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).render("user/login", { error: "Passwords do not match" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findByIdAndUpdate(userID, {
        name,
        mobile,
        password: hashedPassword,
      });
    } else {
      await User.findByIdAndUpdate(userID, {
        name,
        mobile,
      });
    }

    res.redirect("/profile");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("user/login", { error: error.message });
  }
};

module.exports = {
  
  userProfile,
  address,
  getaddAddress,
  postaddAddress,
  editAddress,
  deleteAddress,
  accountDetails,
  postEditAddress,
  postAccountDetails,

};
