<script lang="ts">
	type Mood = 'burnt' | 'argued' | 'simmer' | 'simmer-high' | 'cooked';

	let {
		convergenceScore = 0,
		roundCount = 1,
		currentRound = 1,
		moodOverride
	}: {
		convergenceScore?: number;
		roundCount?: number;
		currentRound?: number;
		moodOverride?: Mood;
	} = $props();

	const mood = $derived.by<Mood>(() => {
		if (moodOverride) return moodOverride;
		if (convergenceScore < 25) return 'burnt';
		if (convergenceScore < 55) return 'argued';
		if (convergenceScore < 75) return 'simmer';
		if (convergenceScore < 90) return 'simmer-high';
		return 'cooked';
	});

	const moodLabel = $derived.by(() =>
		({
			burnt: 'burning - stuck arguing',
			argued: 'heated debate',
			simmer: 'simmering nicely',
			'simmer-high': 'almost there',
			cooked: 'perfectly cooked'
		})[mood]
	);

	const palette = $derived.by(() => {
		switch (mood) {
			case 'burnt':
				return {
					body: '#8e4123',
					bodyTop: '#c6633d',
					bodyBottom: '#5d2813',
					highlight: '#db8f62',
					shadow: '#4d2312',
					lidTop: '#5d5148',
					lidMid: '#4f463f',
					lidLow: '#3f3833',
					weight: '#2b1910',
					burner: '#2d2723'
				};
			case 'cooked':
				return {
					body: '#4f765e',
					bodyTop: '#7ba187',
					bodyBottom: '#355142',
					highlight: '#8db49a',
					shadow: '#24382d',
					lidTop: '#617568',
					lidMid: '#55675b',
					lidLow: '#45544a',
					weight: '#25352b',
					burner: '#30473b'
				};
			default:
				return {
					body: '#b4562a',
					bodyTop: '#c97142',
					bodyBottom: '#7a3a1c',
					highlight: '#d98b5c',
					shadow: '#5e2c15',
					lidTop: '#6a5a50',
					lidMid: '#5a4a40',
					lidLow: '#4a3f35',
					weight: '#3a1e0e',
					burner: '#3a3230'
				};
		}
	});

	const stageClass = $derived.by(() => {
		if (mood === 'burnt') return 'state-burnt';
		if (mood === 'cooked') return 'state-cooked';
		return '';
	});
</script>

<div class={`pot-stage ${stageClass}`}>
	<div class="pot-stage-title">
		<span>
			Pot
			<span class={`mood-chip ${mood}`}>{moodLabel}</span>
		</span>
		<span class="round">Round {String(currentRound).padStart(2, '0')} / {String(roundCount).padStart(2, '0')}</span>
	</div>

	<div class="pot-wrap">
		{#if mood === 'burnt'}
			<span class="smoke" style="bottom:175px; left: calc(50% - 10px); animation-delay: 0s;"></span>
			<span class="smoke" style="bottom:175px; left: calc(50% + 6px); animation-delay: 0.6s;"></span>
			<span class="smoke" style="bottom:175px; left: calc(50% + 18px); animation-delay: 1.2s; width:10px; height:10px;"></span>
			<span class="smoke" style="bottom:175px; left: calc(50% - 14px); animation-delay: 1.6s; width:12px; height:12px;"></span>
			<span class="spark" style="bottom:40px; left: calc(50% - 20px); --sx: -18px; animation-delay: 0.2s;"></span>
			<span class="spark" style="bottom:38px; left: calc(50% + 22px); --sx: 24px; animation-delay: 0.8s;"></span>
			<span class="spark" style="bottom:42px; left: calc(50% - 8px); --sx: -10px; animation-delay: 1.1s;"></span>
		{:else}
			<span class="steam s1" style="bottom:175px; left: calc(50% - 14px);"></span>
			<span class="steam s2" style="bottom:175px; left: calc(50% + 12px);"></span>
			<span class="steam s3" style="bottom:175px; left: calc(50% - 6px);"></span>
			<span class="steam s4" style="bottom:175px; left: calc(50% + 4px);"></span>

			{#if mood === 'argued'}
				<span class="steam s5 fast" style="bottom:175px; left: calc(50% + 20px);"></span>
			{/if}

			{#if mood === 'simmer-high' || mood === 'cooked'}
				<span class={`sparkle ${mood === 'cooked' ? 'big' : ''}`} style="bottom:180px; left: calc(50% - 30px); animation-delay: 0.3s;"></span>
				<span class="sparkle" style="bottom:200px; left: calc(50% + 28px); animation-delay: 1.1s;"></span>
				<span class={`sparkle ${mood === 'cooked' ? 'big' : ''}`} style="bottom:210px; left: calc(50% - 6px); animation-delay: 1.8s;"></span>
			{/if}

			{#if mood === 'cooked'}
				<span class="sparkle" style="bottom:175px; left: calc(50% - 48px); animation-delay: 1.6s;"></span>
				<span class="sparkle big" style="bottom:160px; left: calc(50% + 44px); animation-delay: 2.0s;"></span>
				<div class="cooked-halo">✓</div>
			{/if}
		{/if}

		<svg class="pot-svg" viewBox="0 0 88 90" xmlns="http://www.w3.org/2000/svg" aria-label="Pressure cooker status">
			<rect x="8" y="78" width="72" height="4" fill={palette.burner} />
			<rect x="10" y="82" width="68" height="3" fill="#1A1613" />

			<rect x="14" y="76" width="6" height="2" fill="var(--ember)">
				<animate attributeName="opacity" values="0.5;1;0.5" dur="1.1s" repeatCount="indefinite" />
			</rect>
			<rect x="28" y="76" width="6" height="2" fill="var(--ember)">
				<animate attributeName="opacity" values="1;0.5;1" dur="0.9s" repeatCount="indefinite" />
			</rect>
			<rect x="42" y="76" width="6" height="2" fill="var(--ember)">
				<animate attributeName="opacity" values="0.6;1;0.6" dur="1.3s" repeatCount="indefinite" />
			</rect>
			<rect x="56" y="76" width="6" height="2" fill="var(--ember)">
				<animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" />
			</rect>
			<rect x="68" y="76" width="6" height="2" fill="var(--ember)">
				<animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
			</rect>

			<rect x="12" y="38" width="64" height="40" fill={palette.body} />
			<rect x="12" y="38" width="64" height="4" fill={palette.bodyTop} />
			<rect x="12" y="72" width="64" height="6" fill={palette.bodyBottom} />
			<rect x="16" y="44" width="3" height="26" fill={palette.highlight} />
			<rect x="19" y="44" width="2" height="26" fill={palette.bodyTop} />
			<rect x="70" y="44" width="4" height="28" fill={palette.shadow} />

			<rect x="14" y="48" width="3" height="3" fill="#3A1E0E" />
			<rect x="71" y="48" width="3" height="3" fill="#3A1E0E" />

			<rect x="4" y="48" width="8" height="4" fill="#3A1E0E" />
			<rect x="76" y="48" width="8" height="4" fill="#3A1E0E" />
			<rect x="4" y="52" width="2" height="2" fill="#1A1613" />
			<rect x="82" y="52" width="2" height="2" fill="#1A1613" />

			<g class="jiggle">
				<rect x="10" y="34" width="68" height="4" fill={palette.lidLow} />
				<rect x="12" y="30" width="64" height="4" fill={palette.lidMid} />
				<rect x="16" y="26" width="56" height="4" fill={palette.lidTop} />
				<rect x="22" y="22" width="44" height="4" fill={palette.lidTop} />
				<rect x="22" y="26" width="3" height="2" fill="#8A7A68" />
				<rect x="26" y="22" width="4" height="2" fill="#8A7A68" />
				<rect x="40" y="18" width="8" height="4" fill={palette.weight} />
				<rect x="42" y="14" width="4" height="4" fill={palette.weight} />
				<rect x="42" y="12" width="4" height="2" fill="#1A1613" />
			</g>

			<g transform="translate(60 16)">
				<rect x="0" y="6" width="4" height="6" fill={palette.weight} />
				<rect x="-2" y="4" width="8" height="2" fill={palette.weight} />
				<g transform-origin="2px 4px">
					<animateTransform
						attributeName="transform"
						type="rotate"
						values="-8 2 4;10 2 4;-8 2 4"
						dur={mood === 'burnt' ? '0.8s' : mood === 'argued' ? '1.1s' : '1.8s'}
						repeatCount="indefinite"
					/>
					<rect x="1" y="0" width="2" height="4" fill={palette.weight} />
					<rect x="0" y="0" width="4" height="1" fill="#1A1613" />
				</g>
			</g>
		</svg>

		<div
			class="heat-glow"
			style={`background: radial-gradient(ellipse at center, ${
				mood === 'burnt'
					? 'rgba(196,53,30,0.6)'
					: mood === 'cooked'
						? 'rgba(107,138,122,0.35)'
						: 'rgba(232,138,42,0.55)'
			} 0%, transparent 70%);`}
		></div>
	</div>
</div>

<style>
	.pot-stage {
		padding: 18px 22px 22px;
		border-bottom: 1px dashed var(--line-2);
		position: relative;
		background: linear-gradient(180deg, transparent 0%, rgba(180, 86, 42, 0.03) 100%);
	}

	.pot-stage.state-burnt {
		background: linear-gradient(180deg, rgba(196, 53, 30, 0.04), transparent 70%);
	}

	.pot-stage.state-cooked {
		background: linear-gradient(180deg, rgba(107, 138, 122, 0.08), transparent 70%);
	}

	.pot-stage-title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ink-3);
		margin-bottom: 4px;
	}

	.round {
		color: var(--ink);
		font-weight: 600;
	}

	.mood-chip {
		display: inline-flex;
		align-items: center;
		margin-left: 6px;
		padding: 3px 6px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--canvas);
		color: var(--ink);
		font-size: 9px;
		letter-spacing: 0.08em;
	}

	.mood-chip.burnt {
		border-color: rgba(196, 53, 30, 0.28);
		background: rgba(196, 53, 30, 0.12);
		color: var(--alarm);
	}

	.mood-chip.argued {
		border-color: rgba(180, 86, 42, 0.28);
		background: rgba(180, 86, 42, 0.08);
		color: var(--copper-3);
	}

	.mood-chip.simmer,
	.mood-chip.simmer-high {
		border-color: rgba(180, 86, 42, 0.22);
		background: rgba(201, 113, 66, 0.08);
		color: var(--copper-3);
	}

	.mood-chip.cooked {
		border-color: rgba(107, 138, 122, 0.28);
		background: rgba(107, 138, 122, 0.12);
		color: var(--cool);
	}

	.pot-wrap {
		position: relative;
		height: 210px;
		display: grid;
		place-items: end center;
		overflow: hidden;
	}

	.pot-svg {
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		shape-rendering: crispEdges;
		width: 220px;
		height: auto;
		z-index: 2;
	}

	.steam,
	.smoke,
	.spark,
	.sparkle,
	.cooked-halo,
	.heat-glow {
		position: absolute;
	}

	.steam {
		left: 50%;
		bottom: 150px;
		width: 10px;
		height: 10px;
		background: var(--steam);
		border-radius: 50%;
		opacity: 0;
		animation: rise 2.6s infinite ease-out;
		box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.04);
		z-index: 1;
	}

	.steam.fast {
		animation-duration: 1.2s;
	}

	.s2 {
		animation-delay: 0.6s;
	}

	.s3 {
		animation-delay: 1.2s;
		width: 8px;
		height: 8px;
	}

	.s4 {
		animation-delay: 1.8s;
		width: 12px;
		height: 12px;
	}

	.s5 {
		animation-delay: 0.3s;
		width: 7px;
		height: 7px;
	}

	.smoke {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: rgba(26, 22, 19, 0.45);
		filter: blur(2px);
		opacity: 0;
		animation: smoke-rise 3.2s infinite ease-out;
	}

	.spark {
		width: 5px;
		height: 5px;
		background: linear-gradient(180deg, #ffbb66, #c4351e);
		clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
		animation: spark-fly 1.4s linear infinite;
	}

	.sparkle {
		width: 12px;
		height: 12px;
		opacity: 0;
		animation: sparkle-twinkle 2.4s infinite ease-in-out;
	}

	.sparkle::before,
	.sparkle::after {
		content: '';
		position: absolute;
		background: rgba(232, 138, 42, 0.8);
	}

	.sparkle::before {
		left: 5px;
		top: 0;
		width: 2px;
		height: 12px;
	}

	.sparkle::after {
		left: 0;
		top: 5px;
		width: 12px;
		height: 2px;
	}

	.sparkle.big {
		transform: scale(1.2);
	}

	.cooked-halo {
		top: 22px;
		right: 44px;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		background: rgba(107, 138, 122, 0.18);
		border: 1px solid rgba(107, 138, 122, 0.35);
		display: grid;
		place-items: center;
		color: var(--cool);
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 600;
		animation: pop 0.25s ease-out;
	}

	.heat-glow {
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 160px;
		height: 30px;
		filter: blur(4px);
		animation: flicker 1.2s infinite ease-in-out alternate;
		z-index: 0;
	}

	.jiggle {
		animation: jiggle 2.4s infinite;
		transform-origin: center;
	}

	@keyframes rise {
		0% {
			transform: translate(-50%, 0) scale(0.6);
			opacity: 0;
		}
		15% {
			opacity: 0.9;
		}
		60% {
			opacity: 0.6;
		}
		100% {
			transform: translate(-50%, -120px) scale(1.8);
			opacity: 0;
		}
	}

	@keyframes smoke-rise {
		0% {
			transform: translate(-50%, 0) scale(0.8);
			opacity: 0;
		}
		25% {
			opacity: 0.5;
		}
		100% {
			transform: translate(-30%, -110px) scale(1.8);
			opacity: 0;
		}
	}

	@keyframes spark-fly {
		0% {
			transform: translate(0, 0) rotate(0deg);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translate(var(--sx), -40px) rotate(30deg);
			opacity: 0;
		}
	}

	@keyframes flicker {
		0% {
			opacity: 0.7;
			transform: translateX(-50%) scaleY(1);
		}
		100% {
			opacity: 1;
			transform: translateX(-50%) scaleY(1.15);
		}
	}

	@keyframes jiggle {
		0%,
		90%,
		100% {
			transform: translate(0, 0);
		}
		92% {
			transform: translate(-1px, 0);
		}
		94% {
			transform: translate(1px, -1px);
		}
		96% {
			transform: translate(-1px, 0);
		}
		98% {
			transform: translate(1px, 0);
		}
	}

	@keyframes sparkle-twinkle {
		0%,
		100% {
			opacity: 0;
			transform: scale(0.4) rotate(0deg);
		}
		35%,
		60% {
			opacity: 1;
			transform: scale(1) rotate(15deg);
		}
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}
</style>
