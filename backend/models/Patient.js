import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [{
        name: String,
        severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
        notes: String
    }],
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        status: { type: String, enum: ['active', 'resolved', 'chronic'] },
        notes: String
    }],
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    insuranceInfo: {
        provider: String,
        policyNumber: String,
        expiryDate: Date,
        coverageType: String
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    height: Number, // cm
    weight: Number, // kg
    nearbyHospital: {
        type: String
    },
    onboardingComplete: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
