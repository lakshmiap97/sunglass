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
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(userID);
   
    const addresses = await Address.findOne({ user: userID });


      // Verify the current password
      if (currentPassword) {
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        // Hash the new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
    }
    

        await user.save();
    res.render("user/accountDetails", { user, addresses, userID });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).send("Internal Server Error");
  }
};


const postAccountDetails = async (req, res) => {
  const { name, mobile, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const userID = req.session.user;
    const user = await User.findById(userID);

    if (!user) {
      return res.status(404).render("user/accountDetails", { message: "User not found", user: null, userID });
    }

    // Validate required fields
    if (!name || !mobile) {
      return res.status(400).render("user/accountDetails", { message: "Name and mobile are required", user, userID });
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).render("user/accountDetails", { message: "Please fill in all password fields", user, userID });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).render("user/accountDetails", { message: "Current password is incorrect", user, userID });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).render("user/accountDetails", { message: "Passwords do not match", user, userID });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Update user details
    user.name = name;
    user.mobile = mobile;

    // Ensure user is not null before saving
    if (user) {
      await user.save();
    } else {
      console.log('User object is null and cannot be saved.');
      return res.status(500).render("user/accountDetails", { message: "User not found", user: null, userID });
    }

    res.redirect("/profile");
  } catch (error) {
    console.error(error.message);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).render("user/accountDetails", { message: "Validation failed. Please provide correct information.", user, userID });
    }

    // Render a view that actually exists or send a JSON response
    res.status(500).render("user/accountDetails", { message: "Server error. Please try again later.", user, userID });
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
