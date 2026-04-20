<script lang="ts">
	import type { RoundOutput } from '$lib/api/types';
	import StreamingPanel from './StreamingPanel.svelte';
	import { updatePauseInstructions, resumeSession, stopSession } from '$lib/stores/session.svelte';

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

	let expanded = $state(round.status !== 'complete' || isLast);
	let copied = $state(false);
	let pauseBuilder = $state('');
	let pauseCritic = $state('');

	$effect(() => { if (!pauseBuilder) pauseBuilder = llm1Instruction; });
	$effect(() => { if (!pauseCritic) pauseCritic = llm2Instruction; });

	$effect(() => {
		if (round.status === 'complete' && !isLast) {
			expanded = false;
		} else {
			expanded = true;
		}
	});

	function copyBuilder() {
		navigator.clipboard.writeText(round.builderOutput);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function handleResume() {
		updatePauseInstructions(pauseBuilder, pauseCritic);
		resumeSession();
	}

	const isStreaming = $derived(
		round.status === 'builder_streaming' || round.status === 'critic_streaming'
	);
	const isPaused = $derived(sessionStatus === 'paused' && isLast);
	const builderStreaming = $derived(round.status === 'builder_streaming');
	const criticStreaming = $derived(round.status === 'critic_streaming');
	const preview = $derived(round.builderOutput.slice(0, 80) + (round.builderOutput.length > 80 ? '…' : ''));
</script>

<div class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden transition-all duration-200 relative {isStreaming ? 'round-card-active' : ''}">
	<!-- Ember particles when streaming -->
	{#if isStreaming}
		<div class="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden h-8 z-10" aria-hidden="true">
			{#each [1,2,3,4,5] as i}
				<div
					class="absolute bottom-0 w-1 h-1 rounded-full bg-orange-500 opacity-0"
					style="left:{15 + i * 16}%; animation: ember-float {1.2 + i * 0.3}s ease-out {i * 0.4}s infinite;"
				></div>
			{/each}
		</div>
	{/if}
	<!-- Collapsed header -->
	{#if !expanded}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={() => (expanded = true)}
			onkeydown={(e) => e.key === 'Enter' && (expanded = true)}
			class="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#222] transition-colors cursor-pointer group"
			role="button"
			tabindex="0"
			aria-expanded={expanded}
		>
			<span class="text-xs font-mono text-gray-500">Round {round.roundNumber}</span>
			<span class="text-green-500 text-xs">✓</span>
			<span class="flex-1 text-xs text-gray-400 truncate">{preview}</span>
			<span class="text-xs text-gray-600">${round.actualCost.toFixed(4)}</span>
			<button
				onclick={(e) => { e.stopPropagation(); copyBuilder(); }}
				class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all text-xs"
				title="Copy builder output"
			>
				{copied ? '✓' : '⎘'}
			</button>
			<span class="text-gray-600 text-xs">▼</span>
		</div>
	{:else}
		<!-- Expanded header -->
		<div class="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
			<span class="text-xs font-mono font-semibold text-gray-300">
				Round {round.roundNumber} of {totalRounds}
			</span>
			{#if isStreaming}
				<span class="text-xs text-orange-400 flex items-center gap-1">
					<span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
					{builderStreaming ? 'Builder streaming…' : 'Critic streaming…'}
				</span>
			{:else if round.status === 'complete'}
				<span class="text-xs text-green-500">✓ Complete</span>
				<span class="text-xs text-gray-600 ml-auto">${round.actualCost.toFixed(4)}</span>
			{/if}
			{#if round.status === 'complete'}
				<button
					onclick={() => (expanded = false)}
					class="text-gray-600 hover:text-gray-300 text-xs ml-auto"
					aria-label="Collapse"
				>▲</button>
			{/if}
		</div>

		<!-- Two-column panels -->
		{#if !isPaused}
			<div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#2a2a2a] min-h-[200px]">
				<StreamingPanel
					label="🔨 Builder"
					modelId={llm1Model}
					content={round.builderOutput}
					streaming={builderStreaming}
					waiting={!round.builderOutput}
					waitingLabel="Waiting for builder…"
				/>
				<StreamingPanel
					label="🔍 Critic"
					modelId={llm2Model}
					content={round.criticOutput}
					streaming={criticStreaming}
					waiting={!round.criticOutput}
					waitingLabel={builderStreaming ? 'Waiting for builder…' : 'Waiting for critic…'}
				/>
			</div>

			<!-- Copy final plan button on last completed round -->
			{#if round.status === 'complete' && isLast}
				<div class="px-4 py-3 border-t border-[#2a2a2a] flex gap-2">
					<button
						onclick={copyBuilder}
						class="text-xs bg-[#222] hover:bg-[#333] border border-[#2a2a2a] text-gray-300 rounded px-3 py-1.5 transition-colors"
					>
						{copied ? '✓ Copied' : '⎘ Copy Final Plan'}
					</button>
				</div>
			{/if}
		{:else}
			<!-- Pause overlay -->
			<div class="px-4 py-4 space-y-3">
				<p class="text-sm text-gray-400 font-medium">Round {round.roundNumber + 1} is ready</p>
				<div>
					<label class="block text-xs text-gray-500 mb-1" for="pause-builder">Builder instruction (editable):</label>
					<textarea
						id="pause-builder"
						bind:value={pauseBuilder}
						rows="3"
						class="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition-colors resize-none"
					></textarea>
				</div>
				<div>
					<label class="block text-xs text-gray-500 mb-1" for="pause-critic">Critic instruction (editable):</label>
					<textarea
						id="pause-critic"
						bind:value={pauseCritic}
						rows="3"
						class="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition-colors resize-none"
					></textarea>
				</div>
				<div class="flex gap-2">
					<button
						onclick={handleResume}
						class="bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg px-4 py-2 text-sm transition-all"
					>
						Resume Round {round.roundNumber + 1}
					</button>
					<button
						onclick={stopSession}
						class="bg-red-900 hover:bg-red-800 text-red-200 rounded-lg px-4 py-2 text-sm transition-all"
					>
						Stop Session
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
