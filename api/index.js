require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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

        console.log('Request:', method, url); // Debug log

        // Static file serving
        if (url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/images/')) {
            console.log('Static file request:', url);
            return handleStaticFile(req, res);
        }

        // Page routes
        if (method === 'GET') {
            if (url === '/' || url === '/login') {
                return renderPage(res, 'login-modern.ejs', { 
                    error: null,
                    title: 'Login - Vehicle Accident Detection'
                });
            }
            if (url === '/index') {
                return renderPage(res, 'index-modern.ejs', { 
                    user: { username: 'Admin', role: 'admin' },
                    stats: {
                        activeModules: 1,
                        networkStatus: 'Online',
                        emergencyContacts: 3,
                        cloudStatus: 'Connected'
                    },
                    title: 'Dashboard - Vehicle Accident Detection Alert System'
                });
            }
            if (url === '/alert') {
                return renderPage(res, 'alert-modern.ejs', { 
                    user: { username: 'Admin', role: 'admin' },
                    title: 'Emergency Alerts - Vehicle Accident Detection Alert System'
                });
            }
        }

        // Auth routes
        if (url.includes('/auth/login') && method === 'POST') {
            return handleLogin(req, res);
        }
        
        if (url.includes('/auth/register') && method === 'POST') {
            return handleRegister(req, res);
        }

        // Default response for unmatched routes
        return res.status(404).json({ error: 'Route not found' });

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

// Static file handler
async function handleStaticFile(req, res) {
    try {
        const { url } = req;
        let filePath;
        let fileName;
        
        if (url.startsWith('/css/')) {
            fileName = url.replace('/css/', '');
            filePath = path.join(__dirname, '..', 'css', fileName);
            res.setHeader('Content-Type', 'text/css');
        } else if (url.startsWith('/js/')) {
            fileName = url.replace('/js/', '');
            filePath = path.join(__dirname, '..', 'js', fileName);
            res.setHeader('Content-Type', 'application/javascript');
        } else if (url.startsWith('/images/')) {
            fileName = url.replace('/images/', '');
            filePath = path.join(__dirname, '..', 'images', fileName);
        } else {
            return res.status(404).json({ error: 'File not found' });
        }

        console.log('Serving static file:', filePath); // Debug log

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log('File not found:', filePath);
            return res.status(404).json({ error: `File not found: ${fileName}` });
        }

        // Read and serve file
        const fileContent = fs.readFileSync(filePath);
        res.status(200).send(fileContent);
        
    } catch (error) {
        console.error('Static file error:', error);
        res.status(500).json({ error: 'Failed to serve static file' });
    }
}

// Page renderer (simplified EJS-like rendering)
async function renderPage(res, templateFile, data) {
    try {
        const templatePath = path.join(__dirname, '..', 'views', templateFile);
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: 'Template not found' });
        }

        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Simple EJS-like template replacement
        template = template.replace(/<%=([^%]+)%>/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k.trim()];
            }
            return value !== undefined ? value : '';
        });

        template = template.replace(/<%-([^%]+)%>/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k.trim()];
            }
            return value !== undefined ? value : '';
        });

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(template);
        
    } catch (error) {
        console.error('Render error:', error);
        res.status(500).json({ error: 'Failed to render page' });
    }
}
