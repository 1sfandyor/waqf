require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const readline = require('readline');

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Try to connect to a local database if the connection string fails
    mongoose.connect('mongodb://localhost:27017/ezan-vakfi')
      .then(() => console.log('Connected to local MongoDB...'))
      .catch(localErr => {
        console.error('Local MongoDB connection error:', localErr);
        process.exit(1);
      });
  });

// Function to prompt for user input
const promptUser = () => {
  rl.question('Foydalanuvchi nomi: ', (username) => {
    rl.question('Email: ', (email) => {
      rl.question('Parol: ', (password) => {
        // Create the admin user
        createAdminUser(username, email, password);
      });
    });
  });
};

// Function to create admin user
const createAdminUser = async (username, email, password) => {
  try {
    // Check if admin already exists
    const existingUser = await User.findOne({ role: 'admin' });
    
    if (existingUser) {
      console.log('Administrator allaqachon mavjud!');
      rl.question('Yangi administrator yaratishni istaysizmi? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Create another admin
          createUser(username, email, password);
        } else {
          console.log('Administrator yaratish bekor qilindi.');
          mongoose.disconnect();
          rl.close();
        }
      });
    } else {
      // Create admin user
      createUser(username, email, password);
    }
  } catch (err) {
    console.error('Xatolik yuz berdi:', err);
    mongoose.disconnect();
    rl.close();
  }
};

// Create user function
const createUser = async (username, email, password) => {
  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    
    if (existingUser) {
      console.log('Bu foydalanuvchi nomi yoki email allaqachon mavjud!');
      rl.question('Boshqa ma\'lumotlar bilan qayta urinishni istaysizmi? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          promptUser();
        } else {
          console.log('Administrator yaratish bekor qilindi.');
          mongoose.disconnect();
          rl.close();
        }
      });
      return;
    }
    
    // Create the user
    const newUser = new User({
      username,
      email,
      password,
      role: 'admin'
    });
    
    await newUser.save();
    
    console.log('Administrator muvaffaqiyatli yaratildi!');
    console.log('Foydalanuvchi ma\'lumotlari:');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Role: admin`);
    
    mongoose.disconnect();
    rl.close();
  } catch (err) {
    console.error('Foydalanuvchi yaratishda xatolik yuz berdi:', err);
    mongoose.disconnect();
    rl.close();
  }
};

// Start the process
console.log('Administrator yaratish uchun quyidagi ma\'lumotlarni kiriting:');
promptUser(); 