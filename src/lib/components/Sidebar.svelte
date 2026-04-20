<script lang="ts">
	import type { RoundOutput, SessionStatus } from '$lib/api/types';
	import PressureCookerViz from './PressureCookerViz.svelte';
	import SessionDetailsTray from './SessionDetailsTray.svelte';
	import VibePanel from './VibePanel.svelte';

	let {
		rounds,
		totalRounds,
		currentRound,
		sessionStatus,
		tokens,
		spentUsd,
		elapsedSec,
		sessionId,
		startedAt,
		onStop,
		onSelectRound = (_round: number) => {}
	}: {
		rounds: RoundOutput[];
		totalRounds: number;
		currentRound: number;
		sessionStatus: SessionStatus;
		tokens: number;
		spentUsd: number;
		elapsedSec: number;
		sessionId: string;
		startedAt: string;
		onStop: () => void;
		onSelectRound?: (round: number) => void;
	} = $props();

	const latestScore = $derived.by(() => {
		const score = rounds.filter((round) => round.convergenceScore != null).at(-1)?.convergenceScore;
		return score ?? 0;
	});

	const stopLabel = $derived.by(() => (sessionStatus === 'complete' || sessionStatus === 'stopped' ? 'Start new session' : 'Stop cooking'));
	const remainingCredits = $derived.by(() => Math.max(0, 6 - spentUsd));
</script>

<aside class="sticky top-0 flex h-[calc(100vh-3rem)] w-[360px] flex-col overflow-hidden border-r border-[var(--line)] bg-[var(--canvas-3)] max-[1180px]:h-auto max-[1180px]:w-full max-[1180px]:border-r-0 max-[1180px]:border-b">
	<div class="flex items-center gap-2.5 border-b border-dashed border-[var(--line-2)] px-[22px] py-5">
		<div class="relative grid h-7 w-7 place-items-center rounded-[3px] bg-[var(--ink)] text-[13px] text-[var(--canvas)]">
			<span class="pc-mono font-semibold">P</span>
			<span class="absolute -top-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--copper)]"></span>
		</div>
		<div class="pc-serif text-[22px]">Pressure<em class="italic text-[var(--copper-3)]">Cooker</em></div>
	</div>

	<PressureCookerViz convergenceScore={latestScore} roundCount={totalRounds} currentRound={currentRound} />
	<VibePanel {rounds} currentRoundIndex={Math.max(0, currentRound - 1)} {totalRounds} onselect={onSelectRound} />
	<SessionDetailsTray
		{tokens}
		{spentUsd}
		{elapsedSec}
		temperature={0.7}
		creditsUsd={remainingCredits}
		sessionId={sessionId}
		startedAt={startedAt}
	/>

	<div class="border-t border-dashed border-[var(--line-2)] p-[22px]">
		<button
			type="button"
			onclick={onStop}
			class="pc-mono flex w-full items-center justify-center gap-3 rounded-[2px] bg-[var(--ink)] px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--canvas)] transition-transform hover:-translate-y-px"
		>
			<span class="h-2 w-2 rounded-full bg-[var(--alarm)] shadow-[0_0_0_3px_rgba(196,53,30,0.2)] animate-pulse"></span>
			{stopLabel}
		</button>
	</div>
</aside>
