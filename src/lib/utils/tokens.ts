import type { OpenRouterModel } from '$lib/api/types';

export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

export function modelPrice(model: OpenRouterModel) {
	return {
		input: parseFloat(model.pricing.prompt) * 1_000_000,
		output: parseFloat(model.pricing.completion) * 1_000_000
	};
}

export interface CostEstimate {
	llm1: number;
	llm2: number;
	summary: number;
	total: number;
	estimatedInputTokens: number;
	estimatedOutputTokens: number;
	contextWarning: { round: number; model: string; tokens: number } | null;
}

export function estimateCost(
	llm1: OpenRouterModel | null,
	llm2: OpenRouterModel | null,
	rounds: number,
	topic: string,
	llm1Instruction: string,
	llm2Instruction: string,
	summaryEnabled: boolean,
	summaryModel: OpenRouterModel | null
): CostEstimate {
	const avgOutputTokens = 800;
	const baseInputTokens =
		estimateTokens(topic) +
		estimateTokens(llm1Instruction) +
		estimateTokens(llm2Instruction) +
		avgOutputTokens * rounds * 2;

	const inputPerCall = baseInputTokens;
	const outputPerCall = avgOutputTokens;

	const p1 = llm1 ? modelPrice(llm1) : { input: 0, output: 0 };
	const p2 = llm2 ? modelPrice(llm2) : { input: 0, output: 0 };

	const llm1Cost =
		rounds *
		((inputPerCall / 1_000_000) * p1.input + (outputPerCall / 1_000_000) * p1.output);
	const llm2Cost =
		rounds *
		((inputPerCall / 1_000_000) * p2.input + (outputPerCall / 1_000_000) * p2.output);

	let summaryCost = 0;
	if (summaryEnabled && summaryModel) {
		const ps = modelPrice(summaryModel);
		summaryCost =
			(outputPerCall / 1_000_000) * ps.input + (outputPerCall / 1_000_000) * ps.output;
	}

	// Context window warning check
	let contextWarning: CostEstimate['contextWarning'] = null;
	const totalTokensAtFinalRound = inputPerCall + outputPerCall * rounds;
	if (llm1 && totalTokensAtFinalRound > 0.8 * llm1.context_length) {
		contextWarning = {
			round: rounds,
			model: llm1.name,
			tokens: Math.round(totalTokensAtFinalRound / 1000)
		};
	} else if (llm2 && totalTokensAtFinalRound > 0.8 * llm2.context_length) {
		contextWarning = {
			round: rounds,
			model: llm2.name,
			tokens: Math.round(totalTokensAtFinalRound / 1000)
		};
	}

	return {
		llm1: llm1Cost,
		llm2: llm2Cost,
		summary: summaryCost,
		total: llm1Cost + llm2Cost + summaryCost,
		estimatedInputTokens: inputPerCall,
		estimatedOutputTokens: outputPerCall,
		contextWarning
	};
}
