const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username already taken!' });
        }
        
        // Create new user (using plain text for now, should use bcrypt in production)
        user = new User({
            username,
            email,
            password
        });
        
        await user.save();
        res.status(201).json({ 
            message: 'Registration successful!',
            user: { username, email }
        });
    } catch (err) {
        console.error('Registration Error: ', err);
        console.error('Error details:', err.name, err.message);
        if (err.code) console.error('MongoDB Error Code:', err.code);
        res.status(500).json({ message: 'Server error during registration.', error: err.message });
    }
});

// GET login endpoint - for browser navigation attempts
router.get('/login', (req, res) => {
    res.status(405).json({ 
        message: 'Method not allowed. Please use POST request for login.',
        method: 'POST',
        url: '/api/auth/login'
    });
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        console.log('Login request body:', req.body);
        
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Hardcoded admin fallback from the existing JS logic
        if (username === "admin" && password === "12345") {
            console.log('Admin login successful');
            return res.status(200).json({ 
                message: 'Login successful', 
                user: { name: 'System Admin', username: 'admin' } 
            });
        }

        // Check if user exists in DB
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        // Match passwords (ideally use bcrypt.compare here)
        if (password !== user.password) {
            console.log('Password mismatch for user:', username);
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        console.log('User login successful:', username);
        res.status(200).json({ 
            message: 'Login successful', 
            user: { name: user.name, username: user.username } 
        });
    } catch (err) {
        console.error('Login Error: ', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
