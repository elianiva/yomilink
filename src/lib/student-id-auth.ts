const AUTH_EMAIL_DOMAIN = "yomilink.local";

export function normalizeStudentId(studentId: string) {
	return studentId.trim().toLowerCase();
}

export function studentIdToAuthEmail(studentId: string) {
	return `${normalizeStudentId(studentId)}@${AUTH_EMAIL_DOMAIN}`;
}
