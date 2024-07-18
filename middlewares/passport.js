const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:7000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  const userprofile = profile;
  const existingUser = await User.findOne({ email: userprofile.emails[0].value });
  if (existingUser) {
    return done(null, existingUser);
  }
  const newUser = await User.create({
    name: userprofile.name.givenName + ' ' + userprofile.name.familyName,
    email: userprofile.emails[0].value,
    password: '', // You may want to generate a random password or handle this differently
    mobile: '', // You may want to handle this differently
    is_admin: 0,
    isActive: true
  });
  done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  if (!user) {
    return done(new Error('User not found'));
  }
  done(null, user);
});

module.exports = { passport };