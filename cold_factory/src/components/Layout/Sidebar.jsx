import { NavLink } from 'react-router-dom';
import {
    HiOutlineHome, HiOutlineLogout, HiOutlineCalendar,
    HiOutlineChatAlt2, HiOutlineCloudUpload,
    HiOutlineBeaker, HiOutlineBell, HiOutlineCurrencyRupee, HiOutlineUser,
    HiOutlineHeart, HiOutlineShieldCheck, HiOutlineClipboardList
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();

    const healthcareItems = [
        { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
        { path: '/upload-report', icon: HiOutlineCloudUpload, label: 'Upload Report' },
        { path: '/ai-analysis', icon: HiOutlineShieldCheck, label: 'My Reports' },
        { path: '/appointments', icon: HiOutlineCalendar, label: 'Appointments' },
        { path: '/prescriptions', icon: HiOutlineClipboardList, label: 'Prescriptions' },
        { path: '/messages', icon: HiOutlineChatAlt2, label: 'Messages' },
        { path: '/profile', icon: HiOutlineUser, label: 'Profile' },
    ];

    const moreItems = [
        { path: '/lab-tests', icon: HiOutlineBeaker, label: 'Lab Tests' },
        { path: '/pharmacy', icon: HiOutlineHeart, label: 'Pharmacy' },
        { path: '/payments', icon: HiOutlineCurrencyRupee, label: 'Payments' },
        { path: '/emergency', icon: HiOutlineBell, label: 'Emergency', className: 'emergency-link' },
    ];

    return (
        <aside className="light-sidebar">
            {/* Logo */}
            <div className="light-sidebar-logo">
                <div className="landing-logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <span className="landing-logo-text">Medi<span>Care</span></span>
            </div>

            {/* Navigation */}
            <nav className="light-sidebar-nav">
                {healthcareItems.map((item) => (
                    <NavLink key={item.path} to={item.path} end={item.path === '/'}
                        className={({ isActive }) =>
                            `light-sidebar-link ${isActive ? 'active' : ''} ${item.className || ''}`
                        }>
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="light-sidebar-divider"></div>
                <p className="light-sidebar-section">More</p>

                {moreItems.map((item) => (
                    <NavLink key={item.path} to={item.path}
                        className={({ isActive }) =>
                            `light-sidebar-link ${isActive ? 'active' : ''} ${item.className || ''}`
                        }>
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className="light-sidebar-footer">
                <div className="light-sidebar-user">
                    <div className="light-sidebar-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="light-sidebar-userinfo">
                        <p className="light-sidebar-username">{user?.name}</p>
                        <p className="light-sidebar-userrole">{user?.role}</p>
                    </div>
                </div>
                <button onClick={logout} className="light-sidebar-link logout-link">
                    <HiOutlineLogout className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
