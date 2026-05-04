const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    severity: {
        type: String, // e.g., 'High', 'Medium', 'Low'
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending' // e.g., 'Pending', 'Resolved', 'Dismissed'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Alert', alertSchema);
