require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
const authRoutes = require('./routes/auth');
const alertsRoutes = require('./routes/alerts');

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);

// Root route redirects to login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accident_detection';

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
const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Local server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
