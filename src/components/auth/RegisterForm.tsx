import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AnimatedInput } from "../ui/input";

interface RegisterFormValues {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface RegisterFormProps {
	onRegister?: (payload: Omit<RegisterFormValues, "confirmPassword">) => Promise<void> | void;
}

const DEFAULT_FORM_STATE: RegisterFormValues = {
	fullName: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
	const [formData, setFormData] = useState<RegisterFormValues>(DEFAULT_FORM_STATE);
	const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof RegisterFormValues, string>> = {};

		if (!formData.fullName.trim()) {
			newErrors.fullName = "Full name is required";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!validateEmail(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Confirm password is required";
		} else if (formData.confirmPassword !== formData.password) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (field: keyof RegisterFormValues) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				fullName: formData.fullName.trim(),
				email: formData.email.trim(),
				password: formData.password,
			};

			if (onRegister) {
				await onRegister(payload);
			} else {
				console.log("Register payload", payload);
			}

			setFormData(DEFAULT_FORM_STATE);
		} catch (error) {
			console.error("Registration error", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900/80">
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-bold text-white mb-2">Hey there! Ready to create an account?</h1>
				<p className="text-gray-400">Please fill in the details below to get started.</p>
			</div>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-5">
					<AnimatedInput
						label="Full Name"
						value={formData.fullName}
						onChange={handleChange("fullName")}
						error={errors.fullName}
						success={Boolean(formData.fullName.trim() && !errors.fullName)}
						required
					/>

					<AnimatedInput
						label="Email Address"
						type="email"
						value={formData.email}
						onChange={handleChange("email")}
						error={errors.email}
						success={Boolean(formData.email && validateEmail(formData.email))}
						required
					/>

					<AnimatedInput
						label="Password"
						type="password"
						value={formData.password}
						onChange={handleChange("password")}
						error={errors.password}
						success={Boolean(formData.password && formData.password.length >= 6)}
						required
					/>

					<AnimatedInput
						label="Confirm Password"
						type="password"
						value={formData.confirmPassword}
						onChange={handleChange("confirmPassword")}
						error={errors.confirmPassword}
						success={Boolean(
							formData.confirmPassword &&
								formData.confirmPassword === formData.password &&
								!errors.confirmPassword
						)}
						required
					/>
				</div>

				<Button type="submit" className="w-full bg-blue-500" disabled={isSubmitting}>
					{isSubmitting ? "Creating account..." : "Create account"}
				</Button>
			</form>
		</Card>
	);
};

