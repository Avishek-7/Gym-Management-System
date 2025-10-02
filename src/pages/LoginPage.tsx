import { LoginForm } from "../components/auth/LoginForm";
import React from "react";
import DarkVeil from "../components/common/Background";

const LoginPage: React.FC = () => {
    return (
        <div className={`min-h-screen flex items-center justify-center bg-${DarkVeil}`}>
            <LoginForm />
        </div>
    );
}
    
export default LoginPage;