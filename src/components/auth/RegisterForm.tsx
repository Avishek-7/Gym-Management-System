import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AnimatedInput } from "../ui/input";
import { registerUser } from "../../services/auth/authService";
import { ensureUserRole } from "../../services/auth/roleService";
import { createUserProfile } from "../../services/auth/userProfileService";
import { createApprovalRequest } from "../../services/approval/approvalService";

interface RegisterFormValues {
	fullName: string;
	email: string;
	phone: string;
	password: string;
	confirmPassword: string;
	role: 'member' | 'trainer' | 'admin';
}

interface RegisterFormProps {
	onRegister?: (payload: Omit<RegisterFormValues, "confirmPassword">) => Promise<void> | void;
}

const DEFAULT_FORM_STATE: RegisterFormValues = {
	fullName: "",
	email: "",
	phone: "",
	password: "",
	confirmPassword: "",
	role: "member",
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
	const navigate = useNavigate();
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

		if (!formData.phone.trim()) {
			newErrors.phone = "Phone number is required";
		} else if (formData.phone.trim().length < 10) {
			newErrors.phone = "Please enter a valid phone number";
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
			// Split full name into first and last name
			const nameParts = formData.fullName.trim().split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';

			const payload = {
				fullName: formData.fullName.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
				password: formData.password,
				role: formData.role,
			};

			// Call the onRegister prop if provided, otherwise use the authService
			if (onRegister) {
				await onRegister(payload);
			} else {
				// 1. Create Firebase Auth user
				const user = await registerUser(payload.email, payload.password, payload.fullName);
				
				// 2. Handle role assignment based on type
				let userRole;
				if (payload.role === 'trainer') {
					// Trainers require approval - assign 'member' initially with pending status
					userRole = await ensureUserRole(user.uid, 'member', { email: payload.email });
					console.log("Registration successful! Trainer approval pending");
					
					// Create a pending approval request in Firestore
					await createApprovalRequest({
						userId: user.uid,
						userEmail: payload.email,
						userName: payload.fullName,
						phone: payload.phone,
						requestedRole: 'trainer',
						currentRole: 'member',
					});
					console.log("Trainer approval request created");
				} else {
					// Members get immediate access
					userRole = await ensureUserRole(user.uid, payload.role, { email: payload.email });
					console.log("Registration successful! User role assigned:", userRole);
				}
				
				// 3. Create user profile document in Firestore
				await createUserProfile(user.uid, {
					firstName,
					lastName,
					email: payload.email,
					phone: payload.phone
				});
				console.log("User profile created successfully");
				
				// 4. Redirect based on user role after successful registration
				if (payload.role === 'trainer') {
					// Show pending approval message and redirect to member dashboard temporarily
					alert('Registration successful! Your trainer account is pending approval. You will be notified once approved.');
					navigate('/member/dashboard');
				} else {
					// Direct access for members
					navigate('/member/dashboard');
				}
			}

			setFormData(DEFAULT_FORM_STATE);
		} catch (error) {
			console.error("Registration error", error);
			// Handle registration error - you can set an error message here
			if (error instanceof Error) {
				setErrors(prev => ({ ...prev, email: error.message || "Registration failed" }));
			}
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
						label="Phone Number"
						type="tel"
						value={formData.phone}
						onChange={handleChange("phone")}
						error={errors.phone}
						success={Boolean(formData.phone.trim().length >= 10 && !errors.phone)}
						required
					/>

					{/* Role Selection */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Register as <span className="text-red-400">*</span>
						</label>
						<div className="grid grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => {
									setFormData((prev) => ({ ...prev, role: 'member' }));
								}}
								className={`p-4 rounded-lg border-2 transition-all ${
									formData.role === 'member'
										? 'border-blue-500 bg-blue-500/10 text-blue-400'
										: 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
								}`}
							>
								<div className="flex flex-col items-center gap-2">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<span className="text-sm font-medium">Member</span>
								</div>
							</button>

							<button
								type="button"
								onClick={() => {
									setFormData((prev) => ({ ...prev, role: 'trainer' }));
								}}
								className={`p-4 rounded-lg border-2 transition-all ${
									formData.role === 'trainer'
										? 'border-green-500 bg-green-500/10 text-green-400'
										: 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
								}`}
							>
								<div className="flex flex-col items-center gap-2">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
									<span className="text-sm font-medium">Trainer</span>
									<span className="text-xs text-green-400">Pending approval</span>
								</div>
							</button>

							<button
								type="button"
								disabled
								title="Admin accounts can only be created by existing administrators"
								className="p-4 rounded-lg border-2 border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-50"
							>
								<div className="flex flex-col items-center gap-2">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
									<span className="text-sm font-medium">Admin</span>
									<span className="text-xs text-gray-600">Restricted</span>
								</div>
							</button>
						</div>
						<div className="mt-2 space-y-1">
							{formData.role === 'member' && (
								<p className="text-xs text-gray-500">
									✓ Immediate access to member dashboard and features
								</p>
							)}
							{formData.role === 'trainer' && (
								<p className="text-xs text-yellow-500">
									⚠️ Your trainer account will require admin approval before full access
								</p>
							)}
						</div>
					</div>

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

			<div className="mt-6 text-center">
				<p className="text-sm text-gray-400">
					Already have an account?{" "}
					<Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
						Sign in
					</Link>
				</p>
			</div>
		</Card>
	);
};

