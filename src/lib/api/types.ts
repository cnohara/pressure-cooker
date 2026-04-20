export interface OpenRouterModel {
	id: string;
	name: string;
	description?: string;
	pricing: {
		prompt: string;
		completion: string;
	};
	context_length: number;
	top_provider?: {
		context_length?: number;
	};
}

export class OpenRouterError extends Error {
	constructor(
		public status: number,
		public body: unknown
	) {
		super(`OpenRouter error ${status}`);
	}
}

export type RoundStatus =
	| 'pending'
	| 'builder_streaming'
	| 'critic_streaming'
	| 'complete'
	| 'paused';

export interface RoundOutput {
	roundNumber: number;
	builderOutput: string;
	criticOutput: string;
	builderTokensUsed: number;
	criticTokensUsed: number;
	actualCost: number;
	status: RoundStatus;
	generationId?: string;
	convergenceScore?: number; // 0-100, parsed from critic output
}

export type SessionStatus = 'idle' | 'running' | 'paused' | 'complete' | 'stopped' | 'error';
export type SummaryStatus = 'idle' | 'streaming' | 'complete';

export interface SessionState {
	id: string;
	topic: string;
	llm1Model: string;
	llm2Model: string;
	llm1Instruction: string;
	llm2Instruction: string;
	totalRounds: number;
	rounds: RoundOutput[];
	summaryEnabled: boolean;
	summaryOutput: string;
	summaryStatus: SummaryStatus;
	status: SessionStatus;
	startedAt: string;
	completedAt: string | null;
	totalActualCost: number;
	errorMessage: string | null;
}
