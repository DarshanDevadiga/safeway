const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const rateLimit = require('express-rate-limit');

// Rate limiting for alert creation (IoT device protection)
const alertCreationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 alerts per window
  message: { message: 'Too many alert requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Get all alerts with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const severity = req.query.severity;
        const status = req.query.status;
        
        // Build filter
        const filter = {};
        if (severity) filter.severity = severity;
        if (status) filter.status = status;
        
        // Fetch alerts with pagination
        const alerts = await Alert.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await Alert.countDocuments(filter);
        
        res.status(200).json({
            alerts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Fetch Alerts Error:', err);
        if (err.message.includes('ns doesn\'t exist') || err.message.includes('Collection does not exist')) {
            res.status(200).json({ alerts: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
        } else {
            res.status(500).json({ message: 'Server error fetching alerts', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
        }
    }
});

// Create a new alert (Payload from ESP32/IoT device)
router.post('/', alertCreationLimit, async (req, res) => {
    try {
        const { latitude, longitude, severity, driverName, vehicleNumber, contactNumber, deviceId } = req.body;
        
        // Validation
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        
        if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }
        
        const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
        if (severity && !validSeverities.includes(severity)) {
            return res.status(400).json({ message: 'Invalid severity level' });
        }
        
        const newAlert = new Alert({
            latitude: latitude || 0,
            longitude: longitude || 0,
            severity: severity || 'High',
            driverName: driverName?.trim() || 'Unknown Driver',
            vehicleNumber: vehicleNumber?.trim() || 'Unknown Vehicle',
            contactNumber: contactNumber?.trim() || 'None',
            deviceId: deviceId?.trim() || 'Unknown Device'
        });
        
        const savedAlert = await newAlert.save();
        
        // Emit real-time notification if Socket.IO is available
        if (req.io) {
            req.io.emit('new_alert', savedAlert);
        }
        
        res.status(201).json({ 
            message: 'Accident Alert logged successfully!', 
            data: savedAlert,
            alertId: savedAlert._id
        });
    } catch (err) {
        console.error('Create Alert Error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.keys(err.errors).map(key => ({
                    field: key,
                    message: err.errors[key].message
                }))
            });
        }
        res.status(500).json({ 
            message: 'Server error creating alert', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Update alert status
router.put('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        
        const validStatuses = ['Pending', 'Resolved', 'Dismissed', 'In Progress'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const alert = await Alert.findByIdAndUpdate(
            req.params.id, 
            { 
                status,
                notes: notes?.trim(),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.status(200).json({
            message: 'Alert updated successfully',
            data: alert
        });
    } catch (err) {
        console.error('Update Alert Error:', err);
        res.status(500).json({ 
            message: 'Server error updating alert',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.status(200).json(alert);
    } catch (err) {
        console.error('Get Alert Error:', err);
        res.status(500).json({ 
            message: 'Server error fetching alert',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete alert (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.status(200).json({
            message: 'Alert deleted successfully'
        });
    } catch (err) {
        console.error('Delete Alert Error:', err);
        res.status(500).json({ 
            message: 'Server error deleting alert',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await Alert.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    critical: { $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] } },
                    high: { $sum: { $cond: [{ $eq: ['$severity', 'High'] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $eq: ['$severity', 'Medium'] }, 1, 0] } },
                    low: { $sum: { $cond: [{ $eq: ['$severity', 'Low'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }
                }
            }
        ]);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStats = await Alert.aggregate([
            { $match: { timestamp: { $gte: today } } },
            { $count: 'todayCount' }
        ]);
        
        res.status(200).json({
            summary: stats[0] || {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                resolved: 0,
                pending: 0
            },
            today: todayStats[0]?.todayCount || 0
        });
    } catch (err) {
        console.error('Alert Stats Error:', err);
        res.status(500).json({ 
            message: 'Server error fetching alert statistics',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;
