import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AnimatedInput } from "../ui/input";
import { resetPassword } from "../../services/auth/authService";

interface PasswordResetFormValues {
	email: string;
}

interface PasswordResetProps {
	onResetPassword?: (email: string) => Promise<void> | void;
}

const DEFAULT_FORM_STATE: PasswordResetFormValues = {
	email: "",
};

type FormErrors = Partial<Record<keyof PasswordResetFormValues, string>>;

export const PasswordReset: React.FC<PasswordResetProps> = ({
	onResetPassword,
}) => {
	const [formData, setFormData] = useState<PasswordResetFormValues>(DEFAULT_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);

	const isEmailValid = useMemo(() => {
		if (!formData.email) return false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(formData.email);
	}, [formData.email]);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (!isEmailValid) {
			newErrors.email = formData.email ? "Please enter a valid email" : "Email is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (field: keyof PasswordResetFormValues) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
		setStatusMessage(null);
		setIsSuccess(false);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!validateForm()) {
			return;
		}

		try {
			setIsSubmitting(true);
			setStatusMessage(null);
			setIsSuccess(false);

			// Use the provided callback or fall back to the imported service function
			if (onResetPassword) {
				await onResetPassword(formData.email.trim());
			} else {
				await resetPassword(formData.email.trim());
			}
			
			setStatusMessage("Password reset email sent! Please check your inbox and follow the instructions.");
			setIsSuccess(true);
			setFormData(DEFAULT_FORM_STATE);
		} catch (error) {
			console.error("Password reset error", error);
			setStatusMessage("Something went wrong while sending the reset email. Please try again.");
			setIsSuccess(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900/80">
			<div className="mb-8 text-center">
				<h2 className="text-3xl font-bold text-white mb-2">Reset your password</h2>
				<p className="text-gray-400">
					Enter your email address and we&apos;ll send you a link to reset your password.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-5">
					<AnimatedInput
						label="Email address"
						type="email"
						value={formData.email}
						onChange={handleChange("email")}
						error={errors.email}
						success={Boolean(formData.email && isEmailValid && !errors.email)}
						required
						className="w-full"
					/>
				</div>

				<Button type="submit" className="w-full bg-blue-500" disabled={isSubmitting}>
					{isSubmitting ? "Sending reset link..." : "Send reset link"}
				</Button>
			</form>

			{statusMessage && (
				<div className={`mt-4 rounded-md border px-4 py-3 text-sm ${
					isSuccess 
						? 'border-green-500 bg-green-500/10 text-green-400' 
						: 'border-border bg-muted/40 text-muted-foreground'
				}`}>
					{statusMessage}
				</div>
			)}

			<div className="mt-6 text-center">
				<Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
					← Back to login
				</Link>
			</div>
		</Card>
	);
};

