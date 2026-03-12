import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    fileName: { type: String, required: true },       // stored on disk
    originalName: { type: String, required: true },   // user-facing name
    fileType: { type: String, required: true },       // mime type
    fileSize: { type: Number, required: true },       // bytes
    filePath: { type: String, required: true },       // server path
    uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Upload', uploadSchema);
