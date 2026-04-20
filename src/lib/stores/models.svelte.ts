import { fetchModels } from '$lib/api/openrouter';
import type { OpenRouterModel } from '$lib/api/types';

export const POPULAR_IDS = [
	'anthropic/claude-opus-4',
	'anthropic/claude-sonnet-4-5',
	'anthropic/claude-haiku-4-5',
	'openai/gpt-4o',
	'openai/gpt-4o-mini',
	'openai/o3-mini',
	'google/gemini-2.0-flash-001',
	'google/gemini-2.5-pro-preview',
	'meta-llama/llama-3.3-70b-instruct',
	'meta-llama/llama-3.1-8b-instruct',
	'mistralai/mistral-large',
	'mistralai/mistral-small',
	'deepseek/deepseek-r1',
	'deepseek/deepseek-chat-v3-0324',
	'qwen/qwen-2.5-72b-instruct'
];

export const POPULAR_GROUPS = [
	{ label: 'Anthropic', prefix: 'anthropic' },
	{ label: 'OpenAI', prefix: 'openai' },
	{ label: 'Google', prefix: 'google' },
	{ label: 'Meta', prefix: 'meta-llama' },
	{ label: 'Mistral', prefix: 'mistralai' },
	{ label: 'DeepSeek', prefix: 'deepseek' },
	{ label: 'Qwen', prefix: 'qwen' }
];

let models = $state<OpenRouterModel[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

export function getModels() {
	return models;
}
export function isLoading() {
	return loading;
}
export function getError() {
	return error;
}

export async function initModels() {
	try {
		loading = true;
		models = await fetchModels();
		models.sort((a, b) => a.id.localeCompare(b.id));
	} catch (e) {
		error = 'Failed to load models';
	} finally {
		loading = false;
	}
}

export function getPopularModels(): OpenRouterModel[] {
	const map = new Map(models.map((m) => [m.id, m]));
	return POPULAR_IDS.map((id) => map.get(id)).filter(Boolean) as OpenRouterModel[];
}

export function findModel(id: string): OpenRouterModel | undefined {
	return models.find((m) => m.id === id);
}

export function getCheapestPopular(): OpenRouterModel | null {
	const popular = getPopularModels();
	const priced = popular.filter((m) => parseFloat(m.pricing.prompt) > 0);
	if (!priced.length) return popular[0] ?? null;
	return priced.reduce((a, b) =>
		parseFloat(a.pricing.prompt) < parseFloat(b.pricing.prompt) ? a : b
	);
}
