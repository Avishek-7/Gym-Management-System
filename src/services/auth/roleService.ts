import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	serverTimestamp,
	setDoc,
	where,
} from "firebase/firestore";

import { db } from "../core/firebase";

const COLLECTION_NAME = "userRoles";

const ROLE_OPTIONS = ["admin", "member", "trainer"] as const;

export type UserRole = (typeof ROLE_OPTIONS)[number];

export interface UserRoleRecord {
	userId: string;
	role: UserRole;
	assignedAt: Date;
	assignedBy?: string | null;
}

const defaultRole: UserRole = "member";

const roleCollection = () => collection(db, COLLECTION_NAME);

const roleDoc = (userId: string) => doc(db, COLLECTION_NAME, userId);

const toDate = (input: unknown): Date => {
	if (input && typeof input === "object" && "toDate" in input) {
		try {
			return (input as { toDate: () => Date }).toDate();
		} catch (error) {
			console.warn("Failed to convert Firestore timestamp", error);
		}
	}

	if (typeof input === "string") {
		const parsed = new Date(input);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
	}

	return new Date();
};

const isUserRole = (value: unknown): value is UserRole =>
	typeof value === "string" && ROLE_OPTIONS.includes(value as UserRole);

const buildRecord = (userId: string, data: Record<string, unknown>): UserRoleRecord | null => {
	if (!isUserRole(data.role)) {
		return null;
	}

	return {
		userId,
		role: data.role,
		assignedAt: toDate(data.assignedAt),
		assignedBy: typeof data.assignedBy === "string" ? data.assignedBy : null,
	};
};

export const getUserRoleRecord = async (userId: string): Promise<UserRoleRecord | null> => {
	if (!userId) {
		throw new Error("userId is required to fetch a role");
	}

	const snapshot = await getDoc(roleDoc(userId));
	if (!snapshot.exists()) {
		return null;
	}

	const record = buildRecord(snapshot.id, snapshot.data() ?? {});
	return record;
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
	const record = await getUserRoleRecord(userId);
	return record?.role ?? null;
};

export interface AssignRoleOptions {
	assignedBy?: string;
	assignedAt?: Date;
}

export const assignUserRole = async (
	userId: string,
	role: UserRole,
	options: AssignRoleOptions = {},
): Promise<void> => {
	if (!userId) {
		throw new Error("userId is required to assign a role");
	}

	if (!isUserRole(role)) {
		throw new Error(`Invalid role: ${role}`);
	}

	await setDoc(
		roleDoc(userId),
		{
			role,
			assignedBy: options.assignedBy ?? null,
			assignedAt: options.assignedAt ?? serverTimestamp(),
		},
		{ merge: true },
	);
};

export const ensureUserRole = async (
	userId: string,
	role: UserRole = defaultRole,
	options: AssignRoleOptions = {},
): Promise<UserRole> => {
	const existingRole = await getUserRole(userId);
	if (existingRole) {
		return existingRole;
	}

	await assignUserRole(userId, role, options);
	return role;
};

export const removeUserRole = async (userId: string): Promise<void> => {
	if (!userId) {
		throw new Error("userId is required to remove a role");
	}

	await deleteDoc(roleDoc(userId));
};

export const listUsersByRole = async (role: UserRole): Promise<UserRoleRecord[]> => {
	if (!isUserRole(role)) {
		throw new Error(`Invalid role: ${role}`);
	}

	const roleQuery = query(roleCollection(), where("role", "==", role));
	const snapshot = await getDocs(roleQuery);

	return snapshot.docs
		.map((docSnapshot) => buildRecord(docSnapshot.id, docSnapshot.data() ?? {}))
		.filter((record): record is UserRoleRecord => Boolean(record));
};

export const hasUserRole = async (
	userId: string,
	expected: UserRole | UserRole[],
): Promise<boolean> => {
	const role = await getUserRole(userId);
	if (!role) {
		return false;
	}

	const expectedRoles = Array.isArray(expected) ? expected : [expected];
	return expectedRoles.includes(role);
};

export const getAvailableRoles = (): readonly UserRole[] => ROLE_OPTIONS;

export const getDefaultRole = (): UserRole => defaultRole;
