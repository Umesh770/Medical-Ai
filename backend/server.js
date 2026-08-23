import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import inventoryRoutes from './routes/inventory.js';
import storageRoutes from './routes/storage.js';
import invoiceRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
// Healthcare routes
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import messageRoutes from './routes/messages.js';
import ehrRoutes from './routes/ehr.js';
import prescriptionRoutes from './routes/prescriptions.js';
import labTestRoutes from './routes/labtests.js';
import aiRoutes from './routes/ai.js';
import alertRoutes from './routes/alerts.js';
import paymentRoutes from './routes/payments.js';
import truckRoutes from './routes/trucks.js';
import uploadRoutes from './routes/uploads.js';
import agoraRoutes from './routes/agora.js';

// Load environment variables
dotenv.config();

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
      console.log("MongoDB connected");
      console.log("Mongo host:", mongoose.connection.host);
      console.log("Mongo database:", mongoose.connection.name);
  })
  .catch((err) => {
      console.error("MongoDB connection failed:", err);
  });
// === Existing Cold Storage Routes ===
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// === Healthcare Routes ===
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/labtests', labTestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/agora', agoraRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MediCare Healthcare + Cold-Chain API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MediCare Server running on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});