import { PasswordReset } from "../../components/auth/PasswordReset";
import React from "react";
import DarkVeil from "../../components/common/Background";

const PasswordResetPage: React.FC = () => {
    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-screen h-screen">
                <DarkVeil />
            </div>
            <div className="relative z-10 w-full flex items-center justify-center px-4 py-8">
                <PasswordReset />
            </div>
        </div>
    )
}


export default PasswordResetPage;