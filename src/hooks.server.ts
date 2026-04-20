import type { Handle } from '@sveltejs/kit';

const SITE_PASSWORD = process.env.SITE_PASSWORD;

export const handle: Handle = async ({ event, resolve }) => {
	if (!SITE_PASSWORD) return resolve(event);

	const auth = event.request.headers.get('authorization');
	if (auth?.startsWith('Basic ')) {
		const decoded = atob(auth.slice(6));
		const password = decoded.slice(decoded.indexOf(':') + 1);
		if (password === SITE_PASSWORD) return resolve(event);
	}

	return new Response('Unauthorized', {
		status: 401,
		headers: { 'WWW-Authenticate': 'Basic realm="PressureCooker"' }
	});
};
