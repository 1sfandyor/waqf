const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  // Configure local strategy for username/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'username', // Set username field to 'username' (default)
      passwordField: 'password'  // Set password field to 'password' (default)
    },
    async (username, password, done) => {
      try {
        // Try to find user by username or email
        const user = await User.findOne({
          $or: [{ username }, { email: username }]
        });
        
        // If user not found
        if (!user) {
          return done(null, false, { message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol' });
        }
        
        // Update last login time
        user.lastLogin = Date.now();
        await user.save();
        
        // Return user if authentication successful
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}; 