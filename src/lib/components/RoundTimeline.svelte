<script lang="ts">
	import type { RoundOutput } from '$lib/api/types';

	let {
		rounds,
		totalRounds,
		selectedRound,
		onselect = (_round: number) => {}
	}: {
		rounds: RoundOutput[];
		totalRounds: number;
		selectedRound: number;
		onselect?: (round: number) => void;
	} = $props();

	const allRounds = $derived.by(() =>
		Array.from({ length: totalRounds }, (_, index) => {
			const round = rounds[index];
			const number = index + 1;
			if (!round) {
				return { number, state: 'pending' as const, label: 'queued', value: '-', score: null };
			}

			if (round.status === 'builder_streaming') {
				return { number, state: 'active' as const, label: 'streaming', value: 'Builder drafting', score: round.convergenceScore ?? null };
			}

			if (round.status === 'critic_streaming') {
				return { number, state: 'active' as const, label: 'streaming', value: 'Critic reviewing', score: round.convergenceScore ?? null };
			}

			return {
				number,
				state: number === selectedRound ? 'active' as const : 'done' as const,
				label: 'delivered',
				value: round.convergenceScore != null ? `Agreement ${round.convergenceScore}` : 'Round complete',
				score: round.convergenceScore ?? null
			};
		})
	);
</script>

<div class="border-b border-[var(--line)] px-6 py-5">
	<div class="grid gap-2 md:grid-cols-5">
		{#each allRounds as round}
			<button
				type="button"
				onclick={() => onselect(round.number)}
				class={`relative flex items-center gap-3 rounded-[3px] border px-3 py-3 text-left transition-transform hover:-translate-y-px ${
					round.state === 'active'
						? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] shadow-[0_2px_0_var(--copper-3)]'
						: round.state === 'pending'
							? 'border-dashed border-[var(--line-2)] bg-[rgba(242,235,222,0.4)] text-[var(--ink-3)]'
							: 'border-[var(--line)] bg-[rgba(230,219,195,0.8)] text-[var(--ink)]'
				}`}
			>
				<span class="pc-serif text-[22px] leading-none">{String(round.number).padStart(2, '0')}</span>
				<div class="min-w-0 flex-1">
					<div class={`pc-mono text-[9px] uppercase tracking-[0.12em] ${round.state === 'active' ? 'text-[#E8DCBF]' : 'text-[var(--ink-3)]'}`}>{round.label}</div>
					<div class="pc-mono truncate text-[10px] font-semibold">{round.value}</div>
				</div>
				{#if round.score != null}
					<span class="pc-mono rounded-[2px] bg-[var(--copper)] px-2 py-1 text-[10px] text-[var(--canvas)]">{round.score}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>
