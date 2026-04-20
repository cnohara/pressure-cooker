<script lang="ts">
	import type { RoundOutput } from '$lib/api/types';
	import StreamingPanel from './StreamingPanel.svelte';
	import { resumeSession, stopSession, updatePauseInstructions } from '$lib/stores/session.svelte';

	let {
		round,
		totalRounds,
		llm1Model,
		llm2Model,
		llm1Instruction,
		llm2Instruction,
		sessionStatus,
		isLast = false
	}: {
		round: RoundOutput;
		totalRounds: number;
		llm1Model: string;
		llm2Model: string;
		llm1Instruction: string;
		llm2Instruction: string;
		sessionStatus: string;
		isLast?: boolean;
	} = $props();

	let expanded = $state(false);
	let pauseBuilder = $state('');
	let pauseCritic = $state('');

	$effect(() => {
		expanded = round.status !== 'complete' || isLast;
	});

	$effect(() => {
		pauseBuilder = llm1Instruction;
		pauseCritic = llm2Instruction;
	});

	const isPaused = $derived(sessionStatus === 'paused' && isLast);

	function handleResume() {
		updatePauseInstructions(pauseBuilder, pauseCritic);
		resumeSession();
	}
</script>

<div class="pc-card overflow-hidden rounded-[3px]">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex w-full items-center justify-between border-b border-[var(--line)] px-4 py-3 text-left"
	>
		<div class="flex items-center gap-3">
			<span class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">Round {round.roundNumber} / {totalRounds}</span>
			<span class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)]">{round.status.replace('_', ' ')}</span>
		</div>
		<span class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">${round.actualCost.toFixed(4)}</span>
	</button>

	{#if expanded}
		{#if isPaused}
			<div class="space-y-4 p-4">
				<div>
					<label class="pc-kicker mb-2 block" for="pause-builder">Builder instruction</label>
					<textarea id="pause-builder" bind:value={pauseBuilder} rows="4" class="w-full rounded-[3px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-3"></textarea>
				</div>
				<div>
					<label class="pc-kicker mb-2 block" for="pause-critic">Critic instruction</label>
					<textarea id="pause-critic" bind:value={pauseCritic} rows="4" class="w-full rounded-[3px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-3"></textarea>
				</div>
				<div class="flex gap-2">
					<button type="button" onclick={handleResume} class="pc-mono rounded-[2px] border border-[var(--copper-3)] bg-[var(--copper)] px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-[var(--canvas)]">Resume</button>
					<button type="button" onclick={stopSession} class="pc-mono rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-[var(--ink)]">Stop</button>
				</div>
			</div>
		{:else}
			<div class="grid gap-px bg-[var(--line)] md:grid-cols-2">
				<StreamingPanel
					role="builder"
					modelId={llm1Model}
					content={round.builderOutput}
					streaming={round.status === 'builder_streaming'}
					waiting={!round.builderOutput}
					statusLabel={round.status === 'builder_streaming' ? 'Streaming' : round.builderOutput ? 'Delivered' : 'Waiting'}
					tokens={round.builderTokensUsed}
					cost={round.actualCost}
				/>
				<StreamingPanel
					role="critic"
					modelId={llm2Model}
					content={round.criticOutput}
					streaming={round.status === 'critic_streaming'}
					waiting={!round.criticOutput}
					statusLabel={round.status === 'critic_streaming' ? 'Streaming' : round.criticOutput ? 'Delivered' : 'Waiting'}
					tokens={round.criticTokensUsed}
					cost={round.actualCost}
				/>
			</div>
		{/if}
	{/if}
</div>
