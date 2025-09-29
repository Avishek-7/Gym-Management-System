import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
    isAuthenticated?: boolean;
    userRole?: 'admin' | 'member' | 'trainer';
    onLogout?: () => void;
}

const mainLinks = [
    { to: '/', label: 'Home', matchPrefix: false },
    { to: '/classes', label: 'Classes', matchPrefix: true },
    { to: '/trainers', label: 'Trainers', matchPrefix: true },
];

const Header: React.FC<HeaderProps> = ({ isAuthenticated = false, userRole, onLogout }) => {
    const location = useLocation();

    const isActive = (to: string, matchPrefix = false) => {
        if (matchPrefix) {
            return location.pathname === to || location.pathname.startsWith(`${to}/`);
        }
        return location.pathname === to;
    };

    return (
        <header className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">
                    GymFit
                </Link>
                
                <nav className="hidden md:flex space-x-6" aria-label="Main navigation">
                    {mainLinks.map(({ to, label, matchPrefix }) => (
                        <Link
                            key={to}
                            to={to}
                            aria-current={isActive(to, matchPrefix) ? 'page' : undefined}
                            className={`hover:text-blue-200 ${isActive(to, matchPrefix) ? 'underline decoration-white/70 underline-offset-4' : ''}`}
                        >
                            {label}
                        </Link>
                    ))}
                    {isAuthenticated && (
                        <>
                            <Link
                                to="/dashboard"
                                aria-current={isActive('/dashboard', true) ? 'page' : undefined}
                                className={`hover:text-blue-200 ${isActive('/dashboard', true) ? 'underline decoration-white/70 underline-offset-4' : ''}`}
                            >
                                Dashboard
                            </Link>
                            {userRole === 'admin' && (
                                <Link
                                    to="/admin"
                                    aria-current={isActive('/admin', true) ? 'page' : undefined}
                                    className={`hover:text-blue-200 ${isActive('/admin', true) ? 'underline decoration-white/70 underline-offset-4' : ''}`}
                                >
                                    Admin
                                </Link>
                            )}
                        </>
                    )}
                </nav>

                <div className="flex items-center space-x-4">
                    {isAuthenticated ? (
                        <button 
                            onClick={onLogout}
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            <Link 
                                to="/login" 
                                className="hover:text-blue-200"
                            >
                                Login
                            </Link>
                            <Link 
                                to="/register" 
                                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;