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

<div class="max-w-[860px] mx-auto px-4 py-8">
	{#if selected}
		<!-- Session detail view -->
		<div class="space-y-4">
			<div class="flex items-center gap-3">
				<button onclick={() => (selected = null)} class="text-gray-500 hover:text-white text-sm transition-colors">← Back</button>
				<h1 class="text-lg font-semibold text-white truncate flex-1">{selected.topic}</h1>
				<span class="text-xs text-gray-500">{new Date(selected.startedAt).toLocaleString()}</span>
			</div>

			<div class="text-xs text-gray-500 flex flex-wrap gap-3">
				<span>{selected.llm1Model} (Builder) vs {selected.llm2Model} (Critic)</span>
				<span>{selected.rounds.length} rounds</span>
				<span>Total cost: ${selected.totalActualCost.toFixed(4)}</span>
				<span class="capitalize">{selected.status}</span>
			</div>

			{#each selected.rounds as round}
				<div class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
					<div class="px-4 py-2 border-b border-[#2a2a2a] flex items-center gap-2">
						<span class="text-xs font-mono font-semibold text-gray-400">Round {round.roundNumber}</span>
						<span class="text-xs text-gray-600">${round.actualCost.toFixed(4)}</span>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#2a2a2a] min-h-[150px]">
						<StreamingPanel label="🔨 Builder" modelId={selected.llm1Model} content={round.builderOutput} />
						<StreamingPanel label="🔍 Critic" modelId={selected.llm2Model} content={round.criticOutput} />
					</div>
				</div>
			{/each}

			{#if selected.summaryOutput}
				<div class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
					<div class="text-sm font-semibold text-white mb-3">✦ Summary</div>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<div class="prose">{@html marked(selected.summaryOutput)}</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- History list -->
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-lg font-semibold text-white">Session History</h1>
			{#if sessions.length > 0}
				<button
					onclick={handleClear}
					class="text-xs {confirmClear ? 'text-red-400' : 'text-gray-600 hover:text-red-400'} transition-colors"
				>
					{confirmClear ? 'Confirm clear all?' : 'Clear all history'}
				</button>
			{/if}
		</div>

		{#if sessions.length === 0}
			<div class="text-center py-16 text-gray-600">
				<p class="text-4xl mb-3">🔥</p>
				<p>No sessions yet. Start pressure cooking!</p>
				<a href="/" class="text-orange-400 hover:text-orange-300 text-sm mt-2 inline-block">← Go to main page</a>
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
