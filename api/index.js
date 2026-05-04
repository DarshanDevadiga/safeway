require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
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

    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accident_detection';
        
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        }

        // Route handling
        const { url } = req;
        const method = req.method;

        // Auth routes
        if (url.includes('/auth/login') && method === 'POST') {
            return handleLogin(req, res);
        }
        
        if (url.includes('/auth/register') && method === 'POST') {
            return handleRegister(req, res);
        }

        // Default response for unmatched routes
        return res.status(404).json({ error: 'API endpoint not found' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Login handler
async function handleLogin(req, res) {
    try {
        const { username, password } = req.body;
        
        // Mock authentication for now
        if (username === 'admin' && password === 'admin123') {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token: 'mock-jwt-token',
                user: { username, role: 'admin' }
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Login failed' });
    }
}

// Register handler
async function handleRegister(req, res) {
    try {
        const { username, password, email } = req.body;
        
        // Mock registration
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { username, email }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Registration failed' });
    }
}
