import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, patientAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileComplete, setProfileComplete] = useState(true); // default true; only set false for patients without onboarding

    useEffect(() => {
        checkAuth();
    }, []);

    // Check whether the patient has completed onboarding. Non-patients always return true.
    const checkProfileStatus = async (role) => {
        if (role !== 'patient') {
            setProfileComplete(true);
            return;
        }
        try {
            const res = await patientAPI.getMyProfile();
            const patient = res.data.data;
            setProfileComplete(patient?.onboardingComplete === true);
        } catch {
            // If patient profile doesn't exist yet after registration, mark incomplete
            setProfileComplete(false);
        }
    };

    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authAPI.getMe();
                const u = response.data.user;
                setUser(u);
                setIsAuthenticated(true);
                await checkProfileStatus(u.role);
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        await checkProfileStatus(user.role);
        return response;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        await checkProfileStatus(user.role);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setProfileComplete(true);
    };

    // Called by ProfileSetup after saving so ProtectedRoute lets the user through
    const refreshProfileStatus = async () => {
        if (user) await checkProfileStatus(user.role);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        profileComplete,
        login,
        register,
        logout,
        checkAuth,
        refreshProfileStatus,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export default AuthContext;
