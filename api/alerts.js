require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Alert = require('../models/Alert');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB and create collections if they don't exist
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accident_detection';
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        
        // Create collections if they don't exist
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        // Create alerts collection if it doesn't exist
        if (!collectionNames.includes('alerts')) {
            await db.createCollection('alerts');
            console.log('✅ Created alerts collection');
        }
        
        console.log('✅ Alerts database initialization complete');
    })
    .catch(err => console.error('❌ Database connection error:', err));

// Get all alerts for the dashboard
app.get('/', async (req, res) => {
    try {
        // Fetch alerts, sorting by newest timestamp first
        const alerts = await Alert.find().sort({ timestamp: -1 });
        res.status(200).json(alerts);
    } catch (err) {
        console.error('Fetch Alerts Error:', err);
        res.status(500).json({ message: 'Server error fetching alerts' });
    }
});

// Create a new alert (Payload from ESP32/IoT device)
app.post('/', async (req, res) => {
    try {
        const { latitude, longitude, severity, driverName, vehicleNumber, contactNumber } = req.body;
        
        const newAlert = new Alert({
            latitude: latitude || 0,
            longitude: longitude || 0,
            severity: severity || 'High',
            driverName: driverName || 'Unknown Driver',
            vehicleNumber: vehicleNumber || 'Unknown Vehicle',
            contactNumber: contactNumber || 'None'
        });
        
        const savedAlert = await newAlert.save();
        res.status(201).json({ message: 'Accident Alert logged successfully!', data: savedAlert });
    } catch (err) {
        console.error('Create Alert Error:', err);
        res.status(500).json({ message: 'Server error creating alert', error: err.message });
    }
});

// Route to resolve an alert
app.put('/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status || 'Resolved' },
            { new: true }
        );
        res.status(200).json(alert);
    } catch (err) {
        res.status(500).json({ message: 'Server error updating alert status' });
    }
});

module.exports = app;
