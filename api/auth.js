require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Handler for Vercel serverless function
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

// Connect to MongoDB and create collections if they don't exist
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accident_detection';
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        
        // Create collections if they don't exist
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        // Create users collection if it doesn't exist
        if (!collectionNames.includes('users')) {
            await db.createCollection('users');
            console.log('✅ Created users collection');
        }
        
        console.log('✅ Auth database initialization complete');
    })
    .catch(err => console.error('❌ Database connection error:', err));

// Register endpoint
app.post('/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        // Basic validation
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username already taken!' });
        }
        
        // Create new user
        user = new User({
            name,
            username,
            password
        });
        
        await user.save();
        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error('Registration Error: ', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Hardcoded admin fallback
        if (username === "admin" && password === "12345") {
            return res.status(200).json({ 
                message: 'Login successful', 
                user: { name: 'System Admin', username: 'admin' } 
            });
        }

        // Check if user exists in DB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        // Match passwords
        if (password !== user.password) {
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        res.status(200).json({ 
            message: 'Login successful', 
            user: { name: user.name, username: user.username } 
        });
    } catch (err) {
        console.error('Login Error: ', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = app;
