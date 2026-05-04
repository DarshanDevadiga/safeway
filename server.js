require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) but exclude HTML files
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    },
    filter: (req, res, next) => {
        // Don't serve HTML files statically - let EJS routes handle them
        if (req.path.endsWith('.html')) {
            return next();
        }
        next();
    }
}));

// Routes
const authRoutes = require('./routes/auth');
const alertsRoutes = require('./routes/alerts');

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);

// Favicon route
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Root route redirects to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { 
        error: req.query.error ? req.query.error : null,
        title: 'Login - Vehicle Accident Detection'
    });
});

// Dashboard page
app.get('/index', (req, res) => {
    // Mock data for dashboard
    const stats = {
        activeModules: 1,
        networkStatus: 'Online',
        emergencyContacts: 3,
        cloudStatus: 'Connected'
    };
    
    const user = {
        username: 'Admin',
        role: 'admin'
    };
    
    res.render('index', { 
        user, 
        stats,
        title: 'Dashboard - Vehicle Accident Detection Alert System'
    });
});

// Register page
app.get('/register', (req, res) => {
    res.render('register', { 
        error: req.query.error ? req.query.error : null,
        title: 'Register - Vehicle Accident Detection'
    });
});

// Other pages (EJS templates)
app.get('/about', (req, res) => {
    const user = { username: 'Admin', role: 'admin' };
    res.render('about', { 
        user,
        title: 'Project Report - Vehicle Accident Detection Alert System'
    });
});

app.get('/contact', (req, res) => {
    const user = { username: 'Admin', role: 'admin' };
    res.render('contact', { 
        user,
        title: 'Contact & Admin - Vehicle Accident Detection Alert System'
    });
});

app.get('/live', (req, res) => {
    const user = { username: 'Admin', role: 'admin' };
    res.render('live', { 
        user,
        title: 'Live Sensors - Vehicle Accident Detection Alert System'
    });
});

app.get('/location', (req, res) => {
    const user = { username: 'Admin', role: 'admin' };
    const location = { lat: '12.9716°N', lng: '77.5946°E', speed: '0 km/h', altitude: '920 m' };
    res.render('location', { 
        user,
        location,
        title: 'GPS Map - Vehicle Accident Detection Alert System'
    });
});

app.get('/alert', (req, res) => {
    const user = { username: 'Admin', role: 'admin' };
    res.render('alert', { 
        user,
        title: 'Emergency Alerts - Vehicle Accident Detection Alert System'
    });
});

app.get('/forgot', (req, res) => {
    res.render('forgot', { 
        error: req.query.error ? req.query.error : null,
        success: req.query.success ? req.query.success : null,
        title: 'Forgot Password - Vehicle Accident Detection'
    });
});

// Database connection - force local MongoDB for development
const MONGODB_URI = 'mongodb://localhost:27017/accident_detection';

// Connect to MongoDB and create collections if they don't exist
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
        
        // Create alerts collection if it doesn't exist
        if (!collectionNames.includes('alerts')) {
            await db.createCollection('alerts');
            console.log('✅ Created alerts collection');
        }
        
        console.log('✅ Database initialization complete');
    })
    .catch(err => console.error('❌ Database connection error:', err));

// Start server for local development
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Local server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
