import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    sendOtp: (data) => api.post('/auth/send-otp', data),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
};

// Customer API
export const customerAPI = {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Inventory API
export const inventoryAPI = {
    getAll: () => api.get('/inventory'),
    getStats: () => api.get('/inventory/stats'),
    getLowStock: () => api.get('/inventory/low-stock'),
    create: (data) => api.post('/inventory', data),
    addStock: (data) => api.post('/inventory/stock-entry', data),
    deductStock: (data) => api.post('/inventory/stock-deduct', data),
    update: (id, data) => api.put(`/inventory/${id}`, data),
};

// Storage API
export const storageAPI = {
    getAll: () => api.get('/storage'),
    getById: (id) => api.get(`/storage/${id}`),
    create: (data) => api.post('/storage', data),
    update: (id, data) => api.put(`/storage/${id}`, data),
    delete: (id) => api.delete(`/storage/${id}`),
};

// Invoice API
export const invoiceAPI = {
    getAll: (params) => api.get('/invoices', { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    updatePayment: (id, data) => api.put(`/invoices/${id}/payment`, data),
    downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard'),
};

// === Healthcare APIs ===

// Patient API
export const patientAPI = {
    getAll: () => api.get('/patients'),
    getById: (id) => api.get(`/patients/${id}`),
    getMyProfile: () => api.get('/patients/me'),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.put(`/patients/${id}`, data),
    completeOnboarding: (data) => api.put('/patients/me/onboarding', data),
};


// Doctor API
export const doctorAPI = {
    getAll: (params) => api.get('/doctors', { params }),
    getById: (id) => api.get(`/doctors/${id}`),
    getMyProfile: () => api.get('/doctors/me'),
    update: (id, data) => api.put(`/doctors/${id}`, data),
    search: (specialization) => api.get(`/doctors/search?specialization=${specialization}`),
    updateAvailability: (id, data) => api.put(`/doctors/${id}/availability`, data),
};

// Appointment API
export const appointmentAPI = {
    getAll: () => api.get('/appointments'),
    getById: (id) => api.get(`/appointments/${id}`),
    create: (data) => api.post('/appointments', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    cancel: (id) => api.put(`/appointments/${id}/cancel`),
    getSlots: (doctorId, date) => api.get(`/appointments/slots/${doctorId}?date=${date}`),
};

// Upload API
export const uploadAPI = {
    upload: (formData) => api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getMyFiles: () => api.get('/uploads/my-files'),
    deleteFile: (id) => api.delete(`/uploads/${id}`),
    downloadUrl: (id) => `${API_BASE_URL}/uploads/${id}/download`,
};

// Message API
export const messageAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getMessages: (userId) => api.get(`/messages/${userId}`),
    send: (data) => api.post('/messages', data),
    markRead: (userId) => api.put(`/messages/read/${userId}`),
};

// EHR API
export const ehrAPI = {
    getByPatient: (id) => api.get(`/ehr/${id}`),
    getMyRecords: () => api.get('/ehr/my-records'),
    create: (id, data) => api.post(`/ehr/${id}`, data),
};

// Prescription API
export const prescriptionAPI = {
    getAll: () => api.get('/prescriptions'),
    create: (data) => api.post('/prescriptions', data),
    sendToPharmacy: (id) => api.post(`/prescriptions/${id}/pharmacy`),
};

// Lab Test API
export const labTestAPI = {
    getAll: () => api.get('/labtests'),
    book: (data) => api.post('/labtests', data),
    uploadReport: (id, data) => api.put(`/labtests/${id}/report`, data),
    review: (id, data) => api.put(`/labtests/${id}/review`, data),
};

// AI API
export const aiAPI = {
    predictDisease: (data) => api.post('/ai/predict-disease', data),
    analyzeXray: (data) => api.post('/ai/analyze-xray', data),
    summarizeReport: (data) => api.post('/ai/summarize-report', data),
    checkDrugInteraction: (data) => api.post('/ai/drug-interaction', data),
};

// Alert API
export const alertAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    sendEmergency: (data) => api.post('/alerts/emergency', data),
    acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
    resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

// Payment API
export const paymentAPI = {
    createIntent: (data) => api.post('/payments/create-intent', data),
    verify: (data) => api.post('/payments/verify', data),
    getHistory: () => api.get('/payments/history'),
    getInvoice: (id) => api.get(`/payments/invoice/${id}`),
};

// Truck API
export const truckAPI = {
    getAll: () => api.get('/trucks'),
    getById: (id) => api.get(`/trucks/${id}`),
    create: (data) => api.post('/trucks', data),
    logTemperature: (id, data) => api.post(`/trucks/${id}/temperature`, data),
    logDoor: (id, data) => api.post(`/trucks/${id}/door-event`, data),
    updateLocation: (id, data) => api.put(`/trucks/${id}/location`, data),
};

// Agora API
export const agoraAPI = {
    getToken: (data) => api.post('/agora/token', data),
};

export default api;
