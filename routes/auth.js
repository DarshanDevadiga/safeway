const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Register endpoint with enhanced validation
router.post('/register', authLimit, async (req, res) => {
    try {
        const { username, email, password, name } = req.body;
        
        // Enhanced validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address.' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken!' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered!' });
            }
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name: name?.trim() || username.trim()
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
            message: 'Registration successful!',
            token,
            user: { 
                id: user._id,
                username: user.username, 
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error('Registration Error: ', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists!' });
        }
        res.status(500).json({ 
            message: 'Server error during registration.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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

// Login endpoint with enhanced security
router.post('/login', authLimit, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Hardcoded admin fallback for demo
        if (username === "admin" && password === "12345") {
            const token = jwt.sign(
                { userId: 'admin', username: 'admin', role: 'admin' },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '24h' }
            );
            
            return res.status(200).json({ 
                message: 'Login successful', 
                token,
                user: { 
                    id: 'admin',
                    name: 'System Admin', 
                    username: 'admin',
                    role: 'admin'
                }
            });
        }

        // Check if user exists in DB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Incorrect username or password!' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: 'Login successful', 
            token,
            user: { 
                id: user._id,
                name: user.name, 
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login Error: ', err);
        res.status(500).json({ 
            message: 'Server error during login.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        
        if (decoded.userId === 'admin') {
            return res.status(200).json({
                valid: true,
                user: {
                    id: 'admin',
                    username: 'admin',
                    name: 'System Admin',
                    role: 'admin'
                }
            });
        }
        
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        res.status(200).json({
            valid: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Token verification error:', err);
        res.status(500).json({ message: 'Server error during token verification' });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;
