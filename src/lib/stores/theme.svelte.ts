const STORAGE_KEY = 'pressurecooker_theme';

function loadTheme(): 'light' | 'dark' {
	if (typeof localStorage === 'undefined') return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'dark' || stored === 'light') return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let theme = $state<'light' | 'dark'>('light');

export function initTheme() {
	theme = loadTheme();
}

export function getTheme() {
	return theme;
}

export function toggleTheme() {
	theme = theme === 'light' ? 'dark' : 'light';
	localStorage.setItem(STORAGE_KEY, theme);
}
