import type { SessionState } from '$lib/api/types';
import { loadSessions, saveSessions, pushSession, deleteSession as _del } from '$lib/utils/storage';

let sessions = $state<SessionState[]>([]);

export function getSessions() {
	return sessions;
}

export function initHistory() {
	sessions = loadSessions().reverse();
}

export function saveToHistory(session: SessionState) {
	pushSession(session);
	sessions = loadSessions().reverse();
}

export function removeSession(id: string) {
	_del(id);
	sessions = loadSessions().reverse();
}

export function clearHistory() {
	saveSessions([]);
	sessions = [];
}
