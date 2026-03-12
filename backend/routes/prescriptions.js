import express from 'express';
import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/prescriptions
router.get('/', protect, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (pat) filter.patientId = pat._id;
        } else if (req.user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: req.user._id });
            if (doc) filter.doctorId = doc._id;
        }

        const prescriptions = await Prescription.find(filter)
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/prescriptions
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Only doctors can create prescriptions' });
        }

        const doc = await Doctor.findOne({ userId: req.user._id });
        if (!doc) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        const payload = { ...req.body, doctorId: doc._id };
        const prescription = await Prescription.create(payload);

        res.status(201).json({ success: true, data: prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/prescriptions/:id/send-pharmacy
router.put('/:id/send-pharmacy', protect, async (req, res) => {
    try {
        const prescription = await Prescription.findByIdAndUpdate(
            req.params.id,
            { pharmacyStatus: 'sent', pharmacyId: req.body.pharmacyId || 'default' },
            { new: true }
        );
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
        res.json({ success: true, data: prescription, message: 'Prescription sent to pharmacy' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
