import express from 'express';
import Patient from '../models/Patient.js';
import EHR from '../models/EHR.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/patients
router.get('/', protect, async (req, res) => {
    try {
        const patients = await Patient.find()
            .populate('userId', 'name email phone profileImage')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/patients/me  (MUST be before /:id)
router.get('/me', protect, async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id })
            .populate('userId', 'name email phone profileImage');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/patients/me/onboarding  (MUST be before /:id routes)
router.put('/me/onboarding', protect, async (req, res) => {
    try {
        const {
            bloodGroup, weight, height,
            allergies, medicalConditions,
            emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
            nearbyHospital
        } = req.body;

        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

        // Body metrics
        if (bloodGroup) patient.bloodGroup = bloodGroup;
        if (weight) patient.weight = Number(weight);
        if (height) patient.height = Number(height);
        if (nearbyHospital) patient.nearbyHospital = nearbyHospital;

        // Allergies — stored as simple text entries
        if (allergies && allergies.trim()) {
            const allergyList = allergies.split(',').map(a => a.trim()).filter(Boolean);
            patient.allergies = allergyList.map(name => ({ name, severity: 'mild' }));
        }

        // Medical conditions
        if (medicalConditions && medicalConditions.trim()) {
            const conditions = medicalConditions.split(',').map(c => c.trim()).filter(Boolean);
            patient.medicalHistory = conditions.map(condition => ({ condition, status: 'active' }));
        }

        // Emergency contact
        if (emergencyContactName || emergencyContactPhone) {
            patient.emergencyContact = {
                name: emergencyContactName || '',
                phone: emergencyContactPhone || '',
                relationship: emergencyContactRelationship || ''
            };
        }

        patient.onboardingComplete = true;
        await patient.save();

        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/patients/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('userId', 'name email phone profileImage');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/patients/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/patients/:id/allergies
router.post('/:id/allergies', protect, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        patient.allergies.push(req.body);
        await patient.save();
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/patients/:id/medical-history
router.post('/:id/medical-history', protect, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        patient.medicalHistory.push(req.body);
        await patient.save();
        res.json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
