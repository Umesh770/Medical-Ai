import { HiOutlineBell, HiOutlineSearch, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ title }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            {/* Title */}
            <h2 className="text-xl font-semibold header-title">{title}</h2>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 input-icon w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="header-theme-btn"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? (
                        <HiOutlineSun className="w-5 h-5" />
                    ) : (
                        <HiOutlineMoon className="w-5 h-5" />
                    )}
                </button>

                {/* Notifications */}
                <button className="header-icon-btn">
                    <HiOutlineBell className="w-5 h-5" />
                    <span className="notification-dot"></span>
                </button>

                {/* Date */}
                <div className="text-sm date-text">
                    {new Date().toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </div>
            </div>
        </header>
    );
};

export default Header;
