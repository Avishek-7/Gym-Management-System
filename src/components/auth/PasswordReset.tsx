import React, { useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AnimatedInput } from "../ui/input";

interface PasswordResetFormValues {
	email: string;
	verificationCode: string;
	newPassword: string;
	confirmPassword: string;
}

interface PasswordResetProps {
	onSendResetCode?: (email: string) => Promise<void> | void;
	onResetPassword?: (
		payload: Pick<PasswordResetFormValues, "email" | "verificationCode" | "newPassword">
	) => Promise<void> | void;
}

const DEFAULT_FORM_STATE: PasswordResetFormValues = {
	email: "",
	verificationCode: "",
	newPassword: "",
	confirmPassword: "",
};

type FormErrors = Partial<Record<keyof PasswordResetFormValues, string>>;

export const PasswordReset: React.FC<PasswordResetProps> = ({
	onSendResetCode,
	onResetPassword,
}) => {
	const [formData, setFormData] = useState<PasswordResetFormValues>(DEFAULT_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

		if (!formData.verificationCode.trim()) {
			newErrors.verificationCode = "Verification code is required";
		}

		if (!formData.newPassword) {
			newErrors.newPassword = "New password is required";
		} else if (formData.newPassword.length < 6) {
			newErrors.newPassword = "Password must be at least 6 characters";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your new password";
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
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
	};

	const handleSendCode = async () => {
		if (!isEmailValid) {
			setErrors((prev) => ({ ...prev, email: "Enter a valid email before requesting a code" }));
			return;
		}

		if (!onSendResetCode) {
			setStatusMessage("Simulated: reset code sent to your email.");
			return;
		}

		try {
			setIsSendingCode(true);
			setStatusMessage(null);
			await onSendResetCode(formData.email.trim());
			setStatusMessage("We just sent a verification code to your email.");
		} catch (error) {
			console.error("Password reset code error", error);
			setStatusMessage("Something went wrong while sending the code. Please try again.");
		} finally {
			setIsSendingCode(false);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!validateForm()) {
			return;
		}

		const payload = {
			email: formData.email.trim(),
			verificationCode: formData.verificationCode.trim(),
			newPassword: formData.newPassword,
		};

		try {
			setIsSubmitting(true);
			setStatusMessage(null);

			if (onResetPassword) {
				await onResetPassword(payload);
				setStatusMessage("Your password has been updated. You can now sign in.");
			} else {
				console.log("Password reset payload", payload);
				setStatusMessage("Simulated: password would be reset.");
			}

			setFormData(DEFAULT_FORM_STATE);
		} catch (error) {
			console.error("Password reset error", error);
			setStatusMessage("Something went wrong while resetting your password. Try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900/80">
			<div className="mb-8 text-center">
				<h2 className="text-3xl font-bold text-white mb-2">Reset your password</h2>
				<p className="text-gray-400">
					Enter the email associated with your account. We&apos;ll send you a code to verify
					the request before you set a new password.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-5">
					<div className="space-y-3">
						<AnimatedInput
							label="Email address"
							type="email"
							value={formData.email}
							onChange={handleChange("email")}
							error={errors.email}
							success={Boolean(formData.email && isEmailValid && !errors.email)}
							required
						/>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-muted-foreground">
								We&apos;ll send a verification code to this email.
							</p>
							<Button
								type="button"
								className="bg-blue-500"
								variant="secondary"
								onClick={handleSendCode}
								disabled={isSendingCode || !formData.email}
							>
								{isSendingCode ? "Sending..." : "Send verification code"}
							</Button>
						</div>
					</div>

					<AnimatedInput
						label="Verification code"
						value={formData.verificationCode}
						onChange={handleChange("verificationCode")}
						error={errors.verificationCode}
						success={Boolean(formData.verificationCode && !errors.verificationCode)}
						required
					/>

					<AnimatedInput
						label="New password"
						type="password"
						value={formData.newPassword}
						onChange={handleChange("newPassword")}
						error={errors.newPassword}
						success={Boolean(formData.newPassword && formData.newPassword.length >= 6)}
						required
					/>

					<AnimatedInput
						label="Confirm new password"
						type="password"
						value={formData.confirmPassword}
						onChange={handleChange("confirmPassword")}
						error={errors.confirmPassword}
						success={Boolean(
							formData.confirmPassword &&
								formData.confirmPassword === formData.newPassword &&
								!errors.confirmPassword
						)}
						required
					/>
				</div>

				<Button type="submit" className="w-full bg-blue-500" disabled={isSubmitting}>
					{isSubmitting ? "Updating password..." : "Update password"}
				</Button>
			</form>

			{statusMessage && (
				<div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					{statusMessage}
				</div>
			)}
		</Card>
	);
};

