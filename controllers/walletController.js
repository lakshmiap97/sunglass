const User = require("../models/userModel");
const Wallet = require('../models/walletModel');

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

        let wallet = await Wallet.findOne({ user: userID });
        console.log('Wallet found:', wallet);

        if (!wallet) {
            console.log('Creating new wallet for user:', userID);
            wallet = new Wallet({ user: userID });
            await wallet.save();
            console.log('New wallet created:', wallet);
        }
        wallet.walletdata.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Paginate wallet data
        const totalwallet = wallet.walletdata.length;
        console.log('Total wallet transactions:', totalwallet);

        const totalpage = Math.ceil(totalwallet / limit) || 1;
        console.log('Total pages:', totalpage);
        console.log('Current page:', page);

        // Get the transactions for the current page
        const paginatedTransactions = wallet.walletdata.slice(skip, skip + limit);
        
        console.log('Paginated transactions:', paginatedTransactions);

        res.render('user/wallet', { 
            userID: userID, 
            user: user, 
            wallet: { ...wallet._doc, walletdata: paginatedTransactions }, 
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
