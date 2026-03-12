import mongoose from 'mongoose';

const ehrRecordSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['diagnosis', 'prescription', 'lab_report', 'imaging', 'surgery', 'vaccination', 'allergy', 'vital_signs', 'note'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    doctorName: String,
    diagnosis: String,
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String
    }],
    vitalSigns: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        weight: Number,
        oxygenSaturation: Number
    },
    metadata: mongoose.Schema.Types.Mixed
});

const ehrSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        unique: true
    },
    records: [ehrRecordSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// ehrSchema.index({ patientId: 1 });  // Resolve duplicate schema build warning
const EHR = mongoose.model('EHR', ehrSchema);
export default EHR;
