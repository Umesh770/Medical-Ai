import express from 'express';
import LabTest from '../models/LabTest.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/labtests
router.get('/', protect, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (pat) filter.patientId = pat._id;
        }
        if (req.query.status) filter.status = req.query.status;

        const tests = await LabTest.find(filter)
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
            .sort({ scheduledDate: -1 });

        res.json({ success: true, data: tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/labtests
router.post('/', protect, async (req, res) => {
    try {
        let patientId = req.body.patientId;
        if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (pat) patientId = pat._id;
        }

        const test = await LabTest.create({
            ...req.body,
            patientId,
            cost: req.body.price || 0
        });
        res.status(201).json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/labtests/:id/upload-report
router.put('/:id/upload-report', protect, async (req, res) => {
    try {
        const test = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                reportUrl: req.body.reportUrl,
                reportUploadedAt: new Date(),
                status: 'completed',
                results: req.body.results
            },
            { new: true }
        );
        if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/labtests/:id/review
router.put('/:id/review', protect, async (req, res) => {
    try {
        const doc = await (await import('../models/Doctor.js')).default.findOne({ userId: req.user._id });
        const test = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                reviewedBy: doc?._id,
                reviewNotes: req.body.reviewNotes,
                reviewedAt: new Date()
            },
            { new: true }
        );
        if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
