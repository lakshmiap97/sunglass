const User = require('../models/userModel');

const isBlock = async (req, res, next) => {
    try {
        if (req.session.user) {
            const uID = req.session.user;
            const user = await User.findById(uID);
            if (user && user.isActive == false) {
                // Destroy the session
                return req.session.destroy((err) => { // Added 'return' here
                    if (err) {
                        console.log(err.message);
                        return next(err);
                    }
                    // Redirect to login after session is destroyed
                    return res.redirect('/'); // Stops execution here
                });
            }
        }
        // Only call next() if no redirect was made
        next(); // This will only be reached if no redirect occurred
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

module.exports = { isBlock };
