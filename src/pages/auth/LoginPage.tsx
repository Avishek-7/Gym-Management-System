import { LoginForm } from "../../components/auth/LoginForm";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DarkVeil from "../../components/common/Background";
import { useAuth } from "../../hooks/useAuth";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, userRole, loading } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user && userRole) {
            switch (userRole) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'trainer':
                    navigate('/trainer/dashboard');
                    break;
                case 'member':
                default:
                    navigate('/member/dashboard');
                    break;
            }
        }
    }, [user, userRole, loading, navigate]);

    // Show loading or nothing while redirecting
    if (loading) {
        return (
            <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 w-screen h-screen">
                    <DarkVeil />
                </div>
                <div className="relative z-10 text-white">Loading...</div>
            </div>
        );
    }

    // Don't render login form if user is logged in (will redirect)
    if (user && userRole) {
        return null;
    }

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-screen h-screen">
                <DarkVeil />
            </div>
            <div className="relative z-10 w-full flex items-center justify-center px-4 py-8">
                <LoginForm />
            </div>
        </div>
    );
}
    
export default LoginPage;