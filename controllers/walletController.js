const User = require("../models/userModel");
const Wallet=require('../models/walletModel')

const getwallet = async (req, res) => {
    try {
        console.log('Session user ID:', req.session.user); // Debugging log
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;
        const userID = req.session.user;
        
        if (!userID) {
            console.error('User ID is not defined in session');
            return res.status(400).send('User ID is not defined in session');
        }

        const user = await User.findById(userID);
        console.log('User found:', user); // Debugging log

        let wallet = await Wallet.findOne({ user: userID }) .limit(limit)
        .skip(skip);
        console.log('Wallet found:', wallet);

        if (!wallet) {
            console.log('Creating new wallet for user:', userID);
            wallet = new Wallet({ user: userID });
            await wallet.save();
            console.log('New wallet created:', wallet);
        }

        // Paginate wallet data
        const totalwallet = await Wallet.countDocuments({user: userID})
       console.log('wallu',totalwallet)
        const totalpage = Math.ceil(totalwallet/limit);
      
        console.log('totalpage:', totalpage);
        console.log('currentpage:', page);


        res.render('user/wallet', { 
            userID: userID, 
            user: user, 
            wallet: wallet, 
           
            totalpage: totalpage, 
            totalwallet: totalwallet, 
            currentpage: page 
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    getwallet,
};
