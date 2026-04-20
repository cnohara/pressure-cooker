<script lang="ts">
	import { getSessions, clearHistory } from '$lib/stores/history.svelte';
	import HistoryCard from '$lib/components/HistoryCard.svelte';
	import type { SessionState } from '$lib/api/types';
	import { marked } from 'marked';
	import StreamingPanel from '$lib/components/StreamingPanel.svelte';

	const sessions = $derived(getSessions());

	let selected = $state<SessionState | null>(null);
	let confirmClear = $state(false);

	function handleClear() {
		if (confirmClear) {
			clearHistory();
			confirmClear = false;
		} else {
			confirmClear = true;
			setTimeout(() => (confirmClear = false), 3000);
		}
	}
</script>

<div class="mx-auto max-w-[960px] px-4 py-8">
	{#if selected}
		<div class="space-y-4">
			<div class="flex items-center gap-3">
				<button onclick={() => (selected = null)} class="text-sm text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]">← Back</button>
				<h1 class="pc-serif flex-1 truncate text-[28px] text-[var(--ink)]">{selected.topic}</h1>
				<span class="text-xs text-[var(--ink-3)]">{new Date(selected.startedAt).toLocaleString()}</span>
			</div>

			<div class="pc-mono flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
				<span>{selected.llm1Model} (Builder) vs {selected.llm2Model} (Critic)</span>
				<span>{selected.rounds.length} rounds</span>
				<span>Total cost: ${selected.totalActualCost.toFixed(4)}</span>
				<span class="capitalize">{selected.status}</span>
			</div>

			{#each selected.rounds as round}
				<div class="pc-card overflow-hidden rounded-[3px]">
					<div class="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
						<span class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)]">Round {round.roundNumber}</span>
						<span class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">${round.actualCost.toFixed(4)}</span>
					</div>
					<div class="grid gap-px bg-[var(--line)] sm:grid-cols-2">
						<StreamingPanel role="builder" modelId={selected.llm1Model} content={round.builderOutput} statusLabel="Delivered" tokens={round.builderTokensUsed} cost={round.actualCost} />
						<StreamingPanel role="critic" modelId={selected.llm2Model} content={round.criticOutput} statusLabel="Delivered" tokens={round.criticTokensUsed} cost={round.actualCost} />
					</div>
				</div>
			{/each}

			{#if selected.summaryOutput}
				<div class="pc-card rounded-[3px] p-4">
					<div class="pc-serif mb-3 text-[22px] text-[var(--ink)]">Summary</div>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<div class="pc-prose">{@html marked(selected.summaryOutput)}</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex items-center justify-between mb-6">
			<h1 class="pc-serif text-[34px] text-[var(--ink)]">Session History</h1>
			{#if sessions.length > 0}
				<button
					onclick={handleClear}
					class="text-xs transition-colors {confirmClear ? 'text-[var(--alarm)]' : 'text-[var(--ink-3)] hover:text-[var(--alarm)]'}"
				>
					{confirmClear ? 'Confirm clear all?' : 'Clear all history'}
				</button>
			{/if}
		</div>

		{#if sessions.length === 0}
			<div class="py-16 text-center text-[var(--ink-3)]">
				<p class="text-4xl mb-3">🔥</p>
				<p>No sessions yet. Start pressure cooking!</p>
				<a href="/" class="mt-2 inline-block text-sm text-[var(--copper-3)] underline">← Go to main page</a>
			</div>
		{:else}
			<div class="space-y-2">
				{#each sessions as session (session.id)}
					<HistoryCard {session} onclick={() => (selected = session)} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
