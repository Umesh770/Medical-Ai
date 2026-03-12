import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    medicines: [{
        name: { type: String, required: true },
        dosage: String,
        frequency: String, // "twice daily"
        duration: String,  // "7 days"
        instructions: String,
        quantity: Number
    }],
    diagnosis: String,
    notes: String,
    pharmacyId: String,
    pharmacyStatus: {
        type: String,
        enum: ['not_sent', 'sent', 'processing', 'ready', 'dispensed'],
        default: 'not_sent'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

prescriptionSchema.index({ patientId: 1, createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
