import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AnimatedInput } from "../ui/input";
import { loginUser } from "../../services/auth/authService";
import { ensureUserRole } from "../../services/auth/roleService";


interface LoginFormValues {
    email: string;
    password: string;
    comments?: string;
}

interface LoginFormProps {
    onLogin?: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [formData, setFormData] = useState<LoginFormValues>({
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState<Partial<LoginFormValues>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<LoginFormValues> = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // Call the onLogin prop if provided, otherwise use the authService
            if (onLogin) {
                await onLogin(formData.email, formData.password);
            } else {
                const user = await loginUser(formData.email, formData.password);
                // Ensure user has a role assigned (creates default 'member' role if none exists)
                const userRole = await ensureUserRole(user.uid);
                console.log("Login successful! User role:", userRole);
            }
        } catch (error) {
            console.error("Login error:", error);
            // Handle login error - you can set an error message here
            setErrors(prev => ({ ...prev, password: "Invalid email or password" }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailChange = (value: string) => {
        setFormData(prev => ({ ...prev, email: value }));
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setFormData(prev => ({ ...prev, password: value }));
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
    };

    return (
        <Card className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900/80">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-gray-400">Sign in to your account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                    <AnimatedInput 
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleEmailChange}
                        error={errors.email}
                        success={Boolean(formData.email && validateEmail(formData.email))}
                        required
                        className="w-full"
                    />
                    
                    <AnimatedInput
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={handlePasswordChange}
                        error={errors.password}
                        success={Boolean(formData.password && formData.password.length >= 6)}
                        required
                        className="w-full"
                    />
                </div>
                
                <Button 
                    type="submit" 
                    className="w-full bg-blue-500"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </Card>
    );
};
