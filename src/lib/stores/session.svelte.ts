import { v4 as uuidv4 } from 'uuid';
import { streamCompletion, fetchGeneration } from '$lib/api/openrouter';
import { OpenRouterError } from '$lib/api/types';
import type { SessionState, RoundOutput } from '$lib/api/types';
import { estimateTokens } from '$lib/utils/tokens';
import { saveToHistory } from './history.svelte';
import { getCheapestPopular } from './models.svelte';

let session = $state<SessionState | null>(null);
let abortController = $state<AbortController | null>(null);
let toasts = $state<{ id: string; message: string; type: 'warning' | 'error' | 'info' }[]>([]);
let pauseInstructions = $state({ llm1: '', llm2: '' });

export function getSession() { return session; }
export function getToasts() { return toasts; }
export function getPauseInstructions() { return pauseInstructions; }

function addToast(message: string, type: 'warning' | 'error' | 'info' = 'info') {
	const id = uuidv4();
	toasts = [...toasts, { id, message, type }];
	setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); }, 5000);
}

export function dismissToast(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

function roundAwarenessNote(currentRound: number, totalRounds: number, role: 'builder' | 'critic'): string {
	const remaining = totalRounds - currentRound;
	const isFinal = currentRound === totalRounds;

	if (role === 'builder') {
		if (currentRound > totalRounds) {
			return `\n\n[FINAL SYNTHESIS — ${totalRounds} rounds of critique complete] The critic has delivered their final assessment. Now produce your definitive, polished final response that fully incorporates all feedback. This is the version that will be presented as the final output.`;
		}
		if (isFinal) {
			return `\n\n[ROUND ${currentRound} OF ${totalRounds} — FINAL ROUND] This is your last opportunity to refine. Produce your most complete, robust version of the plan, addressing all remaining criticisms as thoroughly as possible.`;
		}
		return `\n\n[ROUND ${currentRound} OF ${totalRounds} — ${remaining} round${remaining === 1 ? '' : 's'} remaining] You and the critic have ${totalRounds} rounds to converge on a robust plan. Respond substantively to criticisms — each round you should meaningfully improve the plan.`;
	} else {
		if (isFinal) {
			return `\n\n[ROUND ${currentRound} OF ${totalRounds} — FINAL ROUND] This is the last critique. Focus only on the most critical unresolved issues that would prevent successful implementation. After your critique, you MUST end with exactly this line:\nCONVERGENCE: <number>\nWhere <number> is 0–100 representing how completely the builder has addressed all major concerns (0 = nothing addressed, 100 = fully resolved).`;
		}
		return `\n\n[ROUND ${currentRound} OF ${totalRounds} — ${remaining} round${remaining === 1 ? '' : 's'} remaining] You have ${totalRounds} rounds to pressure-test this plan. Be rigorous — identify the most important gaps. After your critique, you MUST end with exactly this line:\nCONVERGENCE: <number>\nWhere <number> is 0–100 representing how completely the builder has addressed all major concerns so far (for round 1, rate the completeness of the initial plan).`;
	}
}

function buildBuilderMessages(
	instruction: string,
	topic: string,
	totalRounds: number,
	rounds: RoundOutput[],
	currentRound: number
): { role: string; content: string }[] {
	const systemContent = instruction.replace('{topic}', topic) + roundAwarenessNote(currentRound, totalRounds, 'builder');
	const msgs: { role: string; content: string }[] = [
		{ role: 'system', content: systemContent }
	];

	for (let r = 1; r < currentRound; r++) {
		const prev = rounds[r - 1];
		if (r === 1) {
			msgs.push({ role: 'user', content: `The topic is: ${topic}. Begin.` });
		} else {
			const prevCritic = stripConvergenceLine(rounds[r - 2]?.criticOutput ?? '');
			msgs.push({
				role: 'user',
				content: `The critic has reviewed your plan. Here is their critique:\n\n---\n${prevCritic}\n---\n\nRevise your plan to address these criticisms. Be thorough.`
			});
		}
		if (prev?.builderOutput) {
			msgs.push({ role: 'assistant', content: prev.builderOutput });
		}
	}

	if (currentRound === 1) {
		msgs.push({ role: 'user', content: `The topic is: ${topic}. Begin.` });
	} else {
		const prevCritic = stripConvergenceLine(rounds[currentRound - 2]?.criticOutput ?? '');
		msgs.push({
			role: 'user',
			content: `The critic has reviewed your plan. Here is their critique:\n\n---\n${prevCritic}\n---\n\nRevise your plan to address these criticisms. Be thorough.`
		});
	}

	return msgs;
}

function buildCriticMessages(
	instruction: string,
	topic: string,
	totalRounds: number,
	currentRound: number,
	builderOutput: string
): { role: string; content: string }[] {
	const systemContent = instruction.replace('{topic}', topic) + roundAwarenessNote(currentRound, totalRounds, 'critic');
	return [
		{ role: 'system', content: systemContent },
		{
			role: 'user',
			content: `Here is the plan to critique:\n\n---\n${builderOutput}\n---\n\nProvide your critique, then end with the CONVERGENCE score as instructed.`
		}
	];
}

function stripConvergenceLine(text: string): string {
	return text.replace(/\nCONVERGENCE:\s*\d+\s*$/i, '').trim();
}

function parseConvergenceScore(text: string): number | undefined {
	const match = text.match(/CONVERGENCE:\s*(\d+)/i);
	if (!match) return undefined;
	return Math.min(100, Math.max(0, parseInt(match[1], 10)));
}

async function runStream(
	apiKey: string,
	model: string,
	messages: { role: string; content: string }[],
	onChunk: (text: string) => void,
	contextLength: number
): Promise<{ tokens: number; cost: number; generationId: string }> {
	// Context guard
	const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
	const totalTokens = estimateTokens(totalChars.toString()) + totalChars / 4;
	if (totalTokens > 0.85 * contextLength) {
		addToast(`Approaching context limit for model — output may be truncated.`, 'warning');
	}

	let generationId = '';
	let retries = 0;

	while (retries <= 3) {
		try {
			const gen = streamCompletion(apiKey, model, messages, abortController!.signal);
			for await (const chunk of gen) {
				if (chunk.id && !generationId) generationId = chunk.id;
				if (chunk.content) onChunk(chunk.content);
			}
			break;
		} catch (e) {
			if (e instanceof OpenRouterError && e.status === 429) {
				retries++;
				if (retries > 3) throw e;
				const wait = 10;
				addToast(`Rate limited. Retrying in ${wait}s...`, 'warning');
				await new Promise((r) => setTimeout(r, wait * 1000));
			} else {
				throw e;
			}
		}
	}

	// Fetch actual usage
	if (generationId && apiKey) {
		const gen = await fetchGeneration(apiKey, generationId);
		if (gen) {
			return {
				tokens: gen.usage?.total_tokens ?? 0,
				cost: gen.total_cost ?? 0,
				generationId
			};
		}
	}

	return { tokens: 0, cost: 0, generationId };
}

export async function startSession(config: {
	apiKey: string;
	llm1Model: string;
	llm2Model: string;
	llm1Instruction: string;
	llm2Instruction: string;
	topic: string;
	totalRounds: number;
	summaryEnabled: boolean;
	pauseBetweenRounds: boolean;
}) {
	abortController = new AbortController();
	pauseInstructions = { llm1: config.llm1Instruction, llm2: config.llm2Instruction };

	session = {
		id: uuidv4(),
		topic: config.topic,
		llm1Model: config.llm1Model,
		llm2Model: config.llm2Model,
		llm1Instruction: config.llm1Instruction,
		llm2Instruction: config.llm2Instruction,
		totalRounds: config.totalRounds,
		rounds: [],
		finalBuilderOutput: '',
		finalBuilderStatus: 'idle',
		finalBuilderCost: 0,
		summaryEnabled: config.summaryEnabled,
		summaryOutput: '',
		summaryStatus: 'idle',
		status: 'running',
		startedAt: new Date().toISOString(),
		completedAt: null,
		totalActualCost: 0,
		errorMessage: null
	};

	try {
		for (let r = 1; r <= config.totalRounds; r++) {
			if (session.status === 'stopped') break;

			const round: RoundOutput = {
				roundNumber: r,
				builderOutput: '',
				criticOutput: '',
				builderTokensUsed: 0,
				criticTokensUsed: 0,
				actualCost: 0,
				status: 'builder_streaming'
			};
			session.rounds = [...session.rounds, round];

			// Builder
			const builderMsgs = buildBuilderMessages(
				pauseInstructions.llm1,
				config.topic,
				config.totalRounds,
				session.rounds.slice(0, -1),
				r
			);

			try {
				const { tokens, cost } = await runStream(
					config.apiKey,
					config.llm1Model,
					builderMsgs,
					(text) => {
						const idx = session!.rounds.length - 1;
						session!.rounds[idx] = { ...session!.rounds[idx], builderOutput: session!.rounds[idx].builderOutput + text };
					},
					20000
				);
				const idx = session.rounds.length - 1;
				session.rounds[idx] = { ...session.rounds[idx], builderTokensUsed: tokens, actualCost: cost, status: 'critic_streaming' };
			} catch (e) {
				await handleStreamError(e, r, 'Builder');
				if ((session.status as SessionState['status']) === 'stopped' || session.status === 'error') break;
			}

			if ((session.status as SessionState['status']) === 'stopped') break;

			// Critic
			const idx = session.rounds.length - 1;
			const criticMsgs = buildCriticMessages(
				pauseInstructions.llm2,
				config.topic,
				config.totalRounds,
				r,
				session.rounds[idx].builderOutput
			);

			try {
				const { tokens, cost } = await runStream(
					config.apiKey,
					config.llm2Model,
					criticMsgs,
					(text) => {
						const i = session!.rounds.length - 1;
						session!.rounds[i] = { ...session!.rounds[i], criticOutput: session!.rounds[i].criticOutput + text };
					},
					20000
				);
				// Parse convergence score and strip it from display text
				const rawCritic = session.rounds[idx].criticOutput;
				const convergenceScore = parseConvergenceScore(rawCritic);
				const cleanCritic = stripConvergenceLine(rawCritic);
				session.rounds[idx] = {
					...session.rounds[idx],
					criticOutput: cleanCritic,
					criticTokensUsed: tokens,
					actualCost: session.rounds[idx].actualCost + cost,
					status: 'complete',
					convergenceScore
				};
				session.totalActualCost += session.rounds[idx].actualCost;
			} catch (e) {
				await handleStreamError(e, r, 'Critic');
				if ((session.status as SessionState['status']) === 'stopped' || session.status === 'error') break;
			}

			if ((session.status as SessionState['status']) === 'stopped') break;

			// Pause between rounds
			if (config.pauseBetweenRounds && r < config.totalRounds) {
				session = { ...session, status: 'paused' };
				// Wait for resume
				await new Promise<void>((resolve) => {
					const check = setInterval(() => {
						if (!session || session.status !== 'paused') {
							clearInterval(check);
							resolve();
						}
					}, 200);
				});
				if ((session.status as SessionState['status']) === 'stopped') break;
				session = { ...session, status: 'running' };
			}
		}

		if ((session.status as SessionState['status']) === 'stopped') {
			saveToHistory(session);
			return;
		}

		// Final builder synthesis — one extra builder turn to incorporate the last critic's feedback
		session = { ...session, finalBuilderStatus: 'streaming' };
		const finalBuilderMsgs = buildBuilderMessages(
			pauseInstructions.llm1,
			config.topic,
			config.totalRounds,
			session.rounds,
			config.totalRounds + 1
		);
		try {
			const { cost } = await runStream(
				config.apiKey,
				config.llm1Model,
				finalBuilderMsgs,
				(text) => { session!.finalBuilderOutput += text; },
				20000
			);
			session = { ...session, finalBuilderStatus: 'complete', finalBuilderCost: cost };
			session.totalActualCost += cost;
		} catch (e) {
			session = { ...session, finalBuilderStatus: 'complete' };
			await handleStreamError(e, config.totalRounds + 1, 'Builder (final synthesis)');
			if ((session.status as SessionState['status']) === 'stopped' || session.status === 'error') {
				saveToHistory(session);
				return;
			}
		}

		// Summary
		if (config.summaryEnabled && (session.status as SessionState['status']) !== 'stopped') {
			session = { ...session, summaryStatus: 'streaming' };
			// Use a reliable fast model — NOT cheapest (low-quality models hallucinate badly on long prompts)
			const SUMMARY_MODEL = 'google/gemini-2.0-flash-001';
			const summaryModelId = SUMMARY_MODEL;
			if (summaryModelId) {
				// Only send the final plan + all critiques to keep the prompt focused and short
				const finalPlan = session.rounds[session.rounds.length - 1]?.builderOutput ?? '';
				let summaryText = `Topic: ${config.topic}\n\n`;
				summaryText += `Final plan (after ${session.rounds.length} rounds of refinement):\n${finalPlan}\n\n`;
				summaryText += `Critiques across rounds:\n`;
				for (const round of session.rounds) {
					summaryText += `Round ${round.roundNumber}: ${round.criticOutput.slice(0, 600)}\n\n`;
				}
				summaryText += `In under 300 words, provide:\n1. What meaningfully improved across rounds\n2. What the critic consistently flagged\n3. What remains unresolved in the final plan\n\nBe concise and specific. Do not pad or repeat.`;

				const summaryMsgs = [
					{ role: 'system', content: 'You are a concise analyst.' },
					{ role: 'user', content: summaryText }
				];

				try {
					await runStream(
						config.apiKey,
						summaryModelId,
						summaryMsgs,
						(text) => { session!.summaryOutput += text; },
						20000
					);
					session = { ...session, summaryStatus: 'complete' };
				} catch {
					session = { ...session, summaryStatus: 'complete' };
				}
			}
		}

		session = { ...session, status: 'complete', completedAt: new Date().toISOString() };
		saveToHistory(session);
	} catch (e) {
		if (session) {
			session = { ...session, status: 'error', errorMessage: String(e) };
			saveToHistory(session);
		}
	}
}

async function handleStreamError(e: unknown, round: number, role: string) {
	if (!session) return;

	if (e instanceof Error && e.name === 'AbortError') {
		session = { ...session, status: 'stopped' };
		return;
	}

	if (e instanceof OpenRouterError) {
		if (e.status === 401) {
			session = { ...session, status: 'error', errorMessage: 'Invalid API key.' };
		} else if (e.status === 404) {
			addToast(`Model not available. Please select another.`, 'error');
			session = { ...session, status: 'error' };
		} else if (e.status === 400) {
			addToast(`Context limit exceeded. Consider a model with a larger context window.`, 'error');
			session = { ...session, status: 'error' };
		} else {
			addToast(`${role} error in round ${round}: ${e.message}`, 'error');
		}
	} else {
		addToast(`Unexpected error in ${role} (round ${round}). See console.`, 'error');
		console.error(e);
	}
}

export function stopSession() {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}
	if (session) {
		const rounds = session.rounds.map((r) =>
			r.status !== 'complete' ? { ...r, status: 'complete' as const } : r
		);
		session = { ...session, status: 'stopped', rounds };
		saveToHistory(session);
	}
}

export function resumeSession() {
	if (session?.status === 'paused') {
		session = { ...session, status: 'running' };
	}
}

export function updatePauseInstructions(llm1: string, llm2: string) {
	pauseInstructions = { llm1, llm2 };
}

export function resetSession() {
	session = null;
	abortController = null;
}
