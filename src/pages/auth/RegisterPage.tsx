import { RegisterForm } from "../../components/auth/RegisterForm";
import React from "react";
import DarkVeil from "../../components/common/Background";

const RegisterPage: React.FC = () => {
    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-screen h-screen">
                <DarkVeil />
            </div>
            <div className="relative z-10 w-full flex items-center justify-center px-4 py-8">
                <RegisterForm />
            </div>
        </div>
    );
}

export default RegisterPage;