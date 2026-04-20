import type { OpenRouterModel } from './types';
import { OpenRouterError } from './types';

const BASE_URL = 'https://openrouter.ai/api/v1';

export async function fetchModels(): Promise<OpenRouterModel[]> {
	const res = await fetch(`${BASE_URL}/models`);
	if (!res.ok) throw new Error('Failed to fetch models');
	const data = await res.json();
	return data.data as OpenRouterModel[];
}

export async function validateKey(apiKey: string): Promise<boolean> {
	try {
		const res = await fetch(`${BASE_URL}/auth/key`, {
			headers: { Authorization: `Bearer ${apiKey}` }
		});
		return res.ok;
	} catch {
		return false;
	}
}

export async function* streamCompletion(
	apiKey: string,
	model: string,
	messages: { role: string; content: string }[],
	abortSignal: AbortSignal
): AsyncGenerator<{ content?: string; id?: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
	const response = await fetch(`${BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://pressurecooker.app',
			'X-Title': 'PressureCooker'
		},
		body: JSON.stringify({
			model,
			messages,
			stream: true,
			max_tokens: 2000
		}),
		signal: abortSignal
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new OpenRouterError(response.status, error);
	}

	const reader = response.body!.getReader();
	const decoder = new TextDecoder();
	let generationId: string | undefined;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		const chunk = decoder.decode(value);
		const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

		for (const line of lines) {
			const data = line.slice(6);
			if (data === '[DONE]') return;
			try {
				const parsed = JSON.parse(data);
				if (parsed.id && !generationId) {
					generationId = parsed.id;
					yield { id: generationId };
				}
				const content = parsed.choices?.[0]?.delta?.content;
				if (content) yield { content };
				if (parsed.usage) yield { usage: parsed.usage };
			} catch {
				/* ignore partial chunks */
			}
		}
	}
}

export async function fetchGeneration(apiKey: string, generationId: string) {
	try {
		const res = await fetch(`${BASE_URL}/generation?id=${generationId}`, {
			headers: { Authorization: `Bearer ${apiKey}` }
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data.data ?? null;
	} catch {
		return null;
	}
}
