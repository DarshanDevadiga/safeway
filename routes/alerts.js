const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// Get all alerts for the dashboard (Fetching)
router.get('/', async (req, res) => {
    try {
        // Fetch alerts, sorting by newest timestamp first
        const alerts = await Alert.find().sort({ timestamp: -1 });
        res.status(200).json(alerts);
    } catch (err) {
        console.error('Fetch Alerts Error:', err);
        // If collection doesn't exist, return empty array instead of error
        if (err.message.includes('ns doesn\'t exist') || err.message.includes('Collection does not exist')) {
            res.status(200).json([]);
        } else {
            res.status(500).json({ message: 'Server error fetching alerts' });
        }
    }
});

// Create a new alert (Payload from ESP32/IoT device)
router.post('/', async (req, res) => {
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

// Optional: Route to resolve an alert
router.put('/:id', async (req, res) => {
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

module.exports = router;
