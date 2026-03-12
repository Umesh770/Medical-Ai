import express from 'express';
import EHR from '../models/EHR.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/ehr/:patientId
router.get('/:patientId', protect, async (req, res) => {
    try {
        let ehr = await EHR.findOne({ patientId: req.params.patientId })
            .populate('records.doctorId', 'name');

        if (!ehr) {
            ehr = await EHR.create({ patientId: req.params.patientId, records: [] });
        }

        res.json({ success: true, data: ehr });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/ehr/:patientId/records
router.post('/:patientId/records', protect, async (req, res) => {
    try {
        let ehr = await EHR.findOne({ patientId: req.params.patientId });
        if (!ehr) {
            ehr = await EHR.create({ patientId: req.params.patientId, records: [] });
        }

        ehr.records.push({
            ...req.body,
            doctorId: req.user._id,
            doctorName: req.user.name,
            date: req.body.date || new Date()
        });
        ehr.lastUpdated = new Date();
        await ehr.save();

        res.status(201).json({ success: true, data: ehr });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/ehr/my/records
router.get('/my/records', protect, async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

        let ehr = await EHR.findOne({ patientId: patient._id });
        if (!ehr) {
            ehr = await EHR.create({ patientId: patient._id, records: [] });
        }

        res.json({ success: true, data: ehr });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
