import type { SessionState } from '$lib/api/types';

const KEY_API = 'pressurecooker_api_key';
const KEY_SESSIONS = 'pressurecooker_sessions';
const MAX_SESSIONS = 20;
const MAX_BYTES = 4 * 1024 * 1024;

export function loadKey(): string {
	if (typeof localStorage === 'undefined') return '';
	return localStorage.getItem(KEY_API) ?? '';
}

export function saveKey(key: string): void {
	localStorage.setItem(KEY_API, key);
}

export function loadSessions(): SessionState[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(KEY_SESSIONS) ?? '[]');
	} catch {
		return [];
	}
}

export function saveSessions(sessions: SessionState[]): void {
	let trimmed = sessions.slice(-MAX_SESSIONS);
	while (trimmed.length > 0) {
		const json = JSON.stringify(trimmed);
		if (json.length <= MAX_BYTES) {
			localStorage.setItem(KEY_SESSIONS, json);
			return;
		}
		trimmed = trimmed.slice(1);
	}
}

export function pushSession(session: SessionState): void {
	const sessions = loadSessions();
	const idx = sessions.findIndex((s) => s.id === session.id);
	if (idx >= 0) sessions[idx] = session;
	else sessions.push(session);
	saveSessions(sessions);
}

export function deleteSession(id: string): SessionState[] {
	const sessions = loadSessions().filter((s) => s.id !== id);
	saveSessions(sessions);
	return sessions;
}
