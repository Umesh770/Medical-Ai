import express from 'express';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/doctors
router.get('/', protect, async (req, res) => {
    try {
        const { specialization, available } = req.query;
        let filter = {};
        if (specialization) filter.specialization = new RegExp(specialization, 'i');
        if (available === 'true') filter.isAvailable = true;

        const doctors = await Doctor.find(filter)
            .populate('userId', 'name email phone profileImage')
            .sort({ 'rating.average': -1 });
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctors/me
router.get('/me', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id })
            .populate('userId', 'name email phone profileImage');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctors/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'name email phone profileImage');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/doctors/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/doctors/:id/availability
router.put('/:id/availability', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { availability: req.body.availability },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctors/:id/patients
router.get('/:id/patients', protect, async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.params.id })
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone' } })
            .sort({ dateTime: -1 });

        const uniquePatients = [];
        const seen = new Set();
        appointments.forEach(a => {
            if (a.patientId && !seen.has(a.patientId._id.toString())) {
                seen.add(a.patientId._id.toString());
                uniquePatients.push(a.patientId);
            }
        });

        res.json({ success: true, data: uniquePatients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
