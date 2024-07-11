const User = require("../models/userModel");
const Wallet=require('../models/walletModel')

const getwallet = async (req, res) => {
    try {
        const userID = req.session.user;
        const user = await User.findById(userID);
       
        let wallet = await Wallet.findOne({ user: userID });
        console.log('wallet found:', wallet);

        if (!wallet) {
            console.log('Creating new wallet for user:', userID);
            wallet = new Wallet({ user: userID });
            await wallet.save();
            console.log('New wallet created:', wallet);
        }

        res.render('user/wallet', { userID, user, wallet });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    getwallet,
   
}