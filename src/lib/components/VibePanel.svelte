<script lang="ts">
	import type { RoundOutput } from '$lib/api/types';

	interface Vibe {
		verdict: string;
		sub: string;
	}

	let {
		rounds,
		currentRoundIndex = 0,
		totalRounds,
		onselect = (_round: number) => {}
	}: {
		rounds: RoundOutput[];
		currentRoundIndex?: number;
		totalRounds: number;
		onselect?: (round: number) => void;
	} = $props();

	function deriveVibe(scores: { score: number | null }[]): Vibe {
		const done = scores.filter((r) => r.score != null);
		if (done.length === 0) return { verdict: 'Just started', sub: 'Waiting for round 1.' };

		const latest = done[done.length - 1].score!;
		const first = done[0].score!;
		const trend = latest - first;
		const n = done.length;

		if (latest >= 90) return { verdict: "They've landed together", sub: 'Both models now agree on the plan.' };
		if (latest >= 75 && trend >= 15) return { verdict: 'Close to agreement', sub: 'Still nudging details, but the shape is settled.' };
		if (trend >= 20) return { verdict: 'Finding common ground', sub: `Agreement has climbed ${trend} points across ${n} rounds.` };
		if (trend >= 5) return { verdict: 'Slowly coming around', sub: 'Small moves toward each other every round.' };
		if (Math.abs(trend) < 5 && latest < 40) return { verdict: 'Stuck arguing', sub: `${n} rounds in and neither side has budged.` };
		if (Math.abs(trend) < 5) return { verdict: 'Holding steady', sub: 'Partial agreement, no movement this round.' };
		if (trend <= -15) return { verdict: 'Drifting apart', sub: `Disagreement has grown since round 1 (${Math.abs(trend)} points lost).` };
		if (trend < 0) return { verdict: 'One side pushing back', sub: 'The Critic keeps surfacing new problems.' };
		return { verdict: 'Working it out', sub: 'Debate in progress.' };
	}

	function emojiForRound(score: number | null, prev: number | null): string {
		if (score == null) return '·';
		const delta = prev == null ? 0 : score - prev;
		if (score < 25) return '🔥';
		if (score >= 85) return '✓';
		if (delta >= 15) return '🤝';
		if (delta <= -10) return '🔥';
		return '↔';
	}

	const filledRounds = $derived.by(() =>
		Array.from({ length: totalRounds }, (_, index) => {
			const round = rounds[index];
			return {
				index,
				roundNumber: index + 1,
				score: round?.convergenceScore ?? null
			};
		})
	);

	const vibe = $derived.by(() => deriveVibe(filledRounds.map((round) => ({ score: round.score }))));

	const spark = $derived.by(() => {
		const width = 240;
		const height = 70;
		const padX = 14;
		const padY = 8;

		const xFor = (index: number) =>
			totalRounds > 1 ? padX + (index / (totalRounds - 1)) * (width - 2 * padX) : width / 2;
		const yFor = (score: number) => padY + (1 - score / 100) * (height - 2 * padY);

		const donePoints = filledRounds
			.filter((round) => round.score != null)
			.map((round) => `${xFor(round.index)},${yFor(round.score!)}`);

		const lastDone = filledRounds.filter((round) => round.score != null).at(-1);
		const fillPoints =
			donePoints.length > 0 && lastDone
				? [
						...donePoints,
						`${xFor(lastDone.index)},${height - padY + 2}`,
						`${xFor(filledRounds.find((round) => round.score != null)?.index ?? 0)},${height - padY + 2}`
					].join(' ')
				: '';

		return {
			linePoints: donePoints.join(' '),
			fillPoints,
			dots: filledRounds.map((round) => ({
				...round,
				x: xFor(round.index),
				y: yFor(round.score ?? 50)
			}))
		};
	});
</script>

<section class="border-b border-dashed border-[var(--line-2)] px-[22px] py-4">
	<div class="mb-1 flex items-baseline justify-between gap-2">
		<span class="pc-kicker">How it's going</span>
		<span class="pc-serif text-[20px] italic leading-[1.15] text-[var(--ink)]">{vibe.verdict}</span>
	</div>
	<div class="mb-3 text-[12px] leading-[1.45] text-[var(--ink-2)]">{vibe.sub}</div>

	<div class="mb-3 rounded-[2px] border border-[var(--line-2)] bg-[var(--canvas-2)] px-2 pt-2 pb-1">
		<svg class="block h-[70px] w-full" viewBox="0 0 240 70" preserveAspectRatio="none" aria-hidden="true">
			<line x1="0" y1="10" x2="240" y2="10" stroke="var(--line-2)" stroke-dasharray="2 3" stroke-width="0.5"></line>
			<line x1="0" y1="35" x2="240" y2="35" stroke="var(--line-2)" stroke-dasharray="2 3" stroke-width="0.5"></line>
			<line x1="0" y1="60" x2="240" y2="60" stroke="var(--line-2)" stroke-dasharray="2 3" stroke-width="0.5"></line>
			<polyline fill="none" stroke="var(--copper)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points={spark.linePoints}></polyline>
			<polygon fill="url(#sparkGrad)" opacity="0.25" points={spark.fillPoints}></polygon>
			<defs>
				<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--copper)"></stop>
					<stop offset="100%" stop-color="var(--copper)" stop-opacity="0"></stop>
				</linearGradient>
			</defs>
			{#each spark.dots as dot}
				<circle
					cx={dot.x}
					cy={dot.y}
					r={dot.index === currentRoundIndex ? 4.5 : 3.5}
					fill={dot.index === currentRoundIndex ? 'var(--ink)' : dot.score == null ? 'var(--canvas)' : 'var(--copper)'}
					stroke="var(--copper-3)"
					stroke-width={dot.index === currentRoundIndex ? 2 : 1.2}
					stroke-dasharray={dot.score == null ? '2 2' : undefined}
				></circle>
			{/each}
		</svg>
		<div class="pc-mono flex justify-between px-0.5 text-[9px] text-[var(--ink-3)]">
			<span>apart</span>
			<span>agreed</span>
		</div>
	</div>

	<div class="mb-2 grid grid-cols-5 gap-1">
		{#each filledRounds as round, index}
			<button
				type="button"
				class={`flex flex-col items-center gap-0.5 rounded-[2px] border px-1 py-1.5 transition-transform hover:-translate-y-px ${
					index === currentRoundIndex
						? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] shadow-[0_2px_0_var(--copper-3)]'
						: round.score == null
							? 'border-dashed border-[var(--line-2)] bg-[var(--canvas)] opacity-55'
							: 'border-[var(--line-2)] bg-[var(--canvas)]'
				}`}
				aria-label={`Round ${round.roundNumber}`}
				onclick={() => onselect(round.roundNumber)}
			>
				<span class="text-[16px] leading-none">{emojiForRound(round.score, filledRounds[index - 1]?.score ?? null)}</span>
				<span class={`pc-mono text-[9px] ${index === currentRoundIndex ? 'text-[var(--canvas-2)]' : 'text-[var(--ink-3)]'}`}>{round.roundNumber}</span>
			</button>
		{/each}
	</div>

	<div class="pc-mono flex flex-wrap gap-x-3 gap-y-2 text-[9px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
		<span>🔥 dispute</span>
		<span>↔ debate</span>
		<span>🤝 agreeing</span>
		<span>✓ done</span>
	</div>
</section>
