import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import ProfileSetup from './pages/ProfileSetup';

// Healthcare Pages
import HealthDashboard from './pages/HealthDashboard';
import Appointments from './pages/Appointments';
import Messages from './pages/Messages';
import VideoConsultation from './pages/VideoConsultation';
import AudioConsultation from './pages/AudioConsultation'; // Added
import UploadReport from './pages/UploadReport';
import AIAnalysis from './pages/AIAnalysis';
import EmergencyAlert from './pages/EmergencyAlert';
import Pharmacy from './pages/Pharmacy';
import LabTests from './pages/LabTests';
import Payments from './pages/Payments';
import Prescriptions from './pages/Prescriptions';
import Profile from './pages/Profile';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
  </div>
);

// Only accessible when logged in AND profile is complete
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profileComplete) return <Navigate to="/profile-setup" replace />;
  return children;
};

// Only accessible when logged in AND profile is NOT complete yet
const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileComplete) return <Navigate to="/" replace />;
  return children;
};

// Only accessible when NOT logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#1e293b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
          }} />

          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* One-time onboarding wizard — shown only when profile is incomplete */}
            <Route path="/profile-setup" element={<OnboardingRoute><ProfileSetup /></OnboardingRoute>} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              {/* Healthcare Routes */}
              <Route path="/" element={<HealthDashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/video-consultation" element={
                <ProtectedRoute>
                  <VideoConsultation />
                </ProtectedRoute>
              } />

              <Route path="/audio-consultation" element={
                <ProtectedRoute>
                  <AudioConsultation />
                </ProtectedRoute>
              } />
              <Route path="/upload-report" element={<UploadReport />} />
              <Route path="/ai-analysis" element={<AIAnalysis />} />
              <Route path="/emergency" element={<EmergencyAlert />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/lab-tests" element={<LabTests />} />
              <Route path="/payments" element={<Payments />} />

              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
