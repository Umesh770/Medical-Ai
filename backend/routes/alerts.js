import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/alerts
router.get('/', protect, async (req, res) => {
    try {
        const { type, status } = req.query;
        let filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const alerts = await Alert.find(filter)
            .populate('patientId')
            .populate('respondedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/alerts/emergency
router.post('/emergency', protect, async (req, res) => {
    try {
        const { location, description } = req.body;
        const Patient = (await import('../models/Patient.js')).default;
        const patient = await Patient.findOne({ userId: req.user._id });

        const alert = await Alert.create({
            type: 'emergency',
            severity: 'critical',
            patientId: patient?._id,
            title: 'EMERGENCY: Patient needs immediate help',
            description: description || 'Patient triggered emergency alert',
            location: location || { latitude: 28.6139, longitude: 77.2090, address: 'Location shared' },
            status: 'active'
        });

        res.status(201).json({
            success: true,
            data: alert,
            message: 'Emergency alert sent! Nearest hospital has been notified.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/alerts/:id/acknowledge
router.put('/:id/acknowledge', protect, async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status: 'acknowledged', respondedBy: req.user._id, respondedAt: new Date() },
            { new: true }
        );
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/alerts/:id/resolve
router.put('/:id/resolve', protect, async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved' },
            { new: true }
        );
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
