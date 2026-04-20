<script lang="ts">
	let {
		convergenceScores = [],
		totalRounds = 1,
		sessionStatus = 'idle'
	}: {
		convergenceScores: (number | undefined)[];
		totalRounds: number;
		sessionStatus: string;
	} = $props();

	const isActive = $derived(sessionStatus === 'running' || sessionStatus === 'paused');
	const isComplete = $derived(sessionStatus === 'complete' || sessionStatus === 'stopped');

	const latestScore = $derived.by(() => {
		const scored = convergenceScores.filter((s): s is number => s !== undefined);
		return scored.length ? scored[scored.length - 1] : 0;
	});

	const gaugeColor = $derived.by(() => {
		if (latestScore < 30) return '#ef4444';
		if (latestScore < 60) return '#f97316';
		if (latestScore < 80) return '#eab308';
		return '#22c55e';
	});

	const pressureLabel = $derived.by(() => {
		if (!isActive && !isComplete) return '';
		if (latestScore < 20) return 'Raw';
		if (latestScore < 45) return 'Heating';
		if (latestScore < 65) return 'Simmering';
		if (latestScore < 80) return 'Pressurized';
		if (latestScore < 95) return 'Nearly Done';
		return 'Fully Cooked!';
	});

	const needleAngle = $derived(-90 + latestScore * 1.8);

	function describeArc(pct: number): string {
		const cx = 50, cy = 50, r = 38;
		if (pct <= 0) return '';
		if (pct >= 100) pct = 99.9;
		const startRad = Math.PI;
		const endRad = Math.PI - (pct / 100) * Math.PI;
		const x1 = cx + r * Math.cos(startRad);
		const y1 = cy + r * Math.sin(startRad);
		const x2 = cx + r * Math.cos(endRad);
		const y2 = cy + r * Math.sin(endRad);
		const large = pct > 50 ? 1 : 0;
		return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
	}
</script>

<div class="flex flex-col items-center gap-3 select-none">

	<!--
		Pixel-art pressure cooker — 32×44 pixel grid, each pixel = 3px → 96×132 display.
		Shape: round pot (oval body), flat lid, knob handle, steam wisps, flames underneath.
		Palette:
		  Pot body:     #4a3f8c (dark purple) / #6257a8 (mid) / #7a6ec0 (highlight)
		  Lid:          #3d3475 / #544a9e
		  Knob:         #1a1535
		  Steam:        #c7d2fe at 70%
		  Flame orange: #f97316 / red: #dc2626 / yellow: #fbbf24 / dark: #7c2d12
	-->
	<svg
		width="96"
		height="132"
		viewBox="0 0 96 132"
		shape-rendering="crispEdges"
		class="overflow-visible pixel-cooker"
		class:active={isActive}
		class:done={isComplete}
		aria-label="Pressure cooker animation"
	>
		<!-- ═══ STEAM (above knob, animated when active) ═══ -->
		{#if isActive}
			<g class="steam-group" opacity="0.75">
				<!-- left wisp -->
				<rect x="33" y="3"  width="3" height="6" fill="#c7d2fe" class="steam-a"/>
				<rect x="30" y="0"  width="3" height="3" fill="#c7d2fe" class="steam-a"/>
				<!-- centre wisp -->
				<rect x="45" y="0"  width="3" height="9" fill="#e0e7ff" class="steam-b"/>
				<rect x="48" y="0"  width="3" height="6" fill="#c7d2fe" class="steam-b"/>
				<!-- right wisp -->
				<rect x="60" y="3"  width="3" height="6" fill="#c7d2fe" class="steam-c"/>
				<rect x="63" y="0"  width="3" height="3" fill="#c7d2fe" class="steam-c"/>
			</g>
		{/if}

		<!-- ═══ LID KNOB / HANDLE ═══ -->
		<rect x="42" y="12" width="12" height="3"  fill="#1a1535"/>
		<rect x="39" y="15" width="18" height="3"  fill="#2d2660"/>
		<rect x="39" y="15" width="18" height="1"  fill="#4a4090"/><!-- knob top sheen -->

		<!-- ═══ LID ═══ -->
		<!-- lid highlight row -->
		<rect x="18" y="18" width="60" height="3"  fill="#7a6ec0"/>
		<!-- lid main -->
		<rect x="15" y="21" width="66" height="9"  fill="#544a9e"/>
		<!-- lid left sheen -->
		<rect x="15" y="21" width="6"  height="9"  fill="#6b60b8"/>
		<!-- lid right shadow -->
		<rect x="75" y="21" width="6"  height="9"  fill="#3d3475"/>
		<!-- lid bottom edge -->
		<rect x="15" y="30" width="66" height="3"  fill="#2d2660"/>

		<!-- ═══ POT BODY — stepped oval ═══ -->
		<!-- step in from lid: row 33 -->
		<rect x="21" y="33" width="54" height="3"  fill="#5a4fa6"/>
		<rect x="21" y="33" width="6"  height="3"  fill="#7a6ec0"/><!-- hl -->
		<rect x="69" y="33" width="6"  height="3"  fill="#3d3475"/><!-- sh -->

		<!-- row 36: wider -->
		<rect x="18" y="36" width="60" height="3"  fill="#5a4fa6"/>
		<rect x="18" y="36" width="6"  height="3"  fill="#7a6ec0"/>
		<rect x="72" y="36" width="6"  height="3"  fill="#3d3475"/>

		<!-- row 39: widest -->
		<rect x="15" y="39" width="66" height="3"  fill="#5a4fa6"/>
		<rect x="15" y="39" width="6"  height="3"  fill="#7a6ec0"/>
		<rect x="75" y="39" width="6"  height="3"  fill="#3d3475"/>

		<!-- HANDLES (sticking out at mid-body) -->
		<!-- left handle -->
		<rect x="0"  y="45" width="15" height="18" fill="#3d3475"/>
		<rect x="0"  y="45" width="15" height="3"  fill="#544a9e"/><!-- handle top -->
		<rect x="0"  y="60" width="15" height="3"  fill="#1a1535"/><!-- handle bottom -->
		<rect x="0"  y="48" width="3"  height="12" fill="#544a9e"/><!-- handle left sheen -->
		<!-- right handle -->
		<rect x="81" y="45" width="15" height="18" fill="#3d3475"/>
		<rect x="81" y="45" width="15" height="3"  fill="#544a9e"/>
		<rect x="81" y="60" width="15" height="3"  fill="#1a1535"/>
		<rect x="93" y="48" width="3"  height="12" fill="#1a1535"/>

		<!-- body main flat section -->
		<rect x="15" y="42" width="66" height="33" fill="#4a3f8c"/>
		<!-- body left highlight strip -->
		<rect x="15" y="42" width="9"  height="33" fill="#6257a8"/>
		<!-- body right shadow strip -->
		<rect x="72" y="42" width="9"  height="33" fill="#2d2460"/>

		<!-- body bottom steps (oval curve) -->
		<rect x="15" y="75" width="66" height="3"  fill="#4a3f8c"/>
		<rect x="15" y="75" width="9"  height="3"  fill="#6257a8"/>
		<rect x="72" y="75" width="9"  height="3"  fill="#2d2460"/>

		<rect x="18" y="78" width="60" height="3"  fill="#3d3475"/>
		<rect x="21" y="81" width="54" height="3"  fill="#2d2660"/>
		<rect x="27" y="84" width="42" height="3"  fill="#1a1535"/>

		<!-- Pressure gauge mini display on body -->
		<rect x="33" y="51" width="30" height="15" fill="#0f0d1f"/><!-- bezel -->
		<rect x="34" y="52" width="28" height="13" fill="#0a0818"/><!-- screen -->
		<!-- bar fill -->
		{#if (isActive || isComplete) && latestScore > 0}
			<rect x="35" y="57" width={Math.round((latestScore / 100) * 26)} height="5" fill={gaugeColor}/>
		{:else}
			<rect x="35" y="57" width="0"  height="5" fill="#1a1535"/>
		{/if}
		<!-- bar bg -->
		<rect x="35" y="57" width="26" height="1"  fill="#1a1535" opacity="0.5"/>
		<!-- tick marks -->
		<rect x="35" y="53" width="1"  height="3"  fill="#2d2a50"/>
		<rect x="48" y="53" width="1"  height="3"  fill="#2d2a50"/>
		<rect x="60" y="53" width="1"  height="3"  fill="#2d2a50"/>

		<!-- completion overlay tint -->
		{#if isComplete}
			<rect x="15" y="18" width="66" height="72" fill="#22c55e" opacity="0.07"/>
		{/if}

		<!-- ═══ FLAMES ═══ -->
		{#if isActive || isComplete}
			<!-- flame base plate -->
			<rect x="9"  y="90" width="78" height="3"  fill="#7c2d12"/>

			<!-- dark base -->
			<rect x="9"  y="93" width="78" height="3"  fill="#dc2626"/>
			<rect x="12" y="96" width="72" height="3"  fill="#dc2626"/>

			<!-- orange layer -->
			<rect x="9"  y="93" width="12" height="12" fill="#ea580c"/>
			<rect x="75" y="93" width="12" height="12" fill="#ea580c"/>
			<rect x="21" y="90" width="54" height="15" fill="#f97316"/>

			<!-- yellow tips — 5 flame columns -->
			<!-- flame 1 (left) -->
			<rect x="12" y="87" width="9"  height="9"  fill="#f97316"/>
			<rect x="15" y="84" width="3"  height="3"  fill="#fbbf24"/>
			<!-- flame 2 -->
			<rect x="27" y="84" width="12" height="12" fill="#f97316"/>
			<rect x="30" y="81" width="6"  height="3"  fill="#fbbf24"/>
			<rect x="33" y="78" width="3"  height="3"  fill="#fef08a"/>
			<!-- flame 3 (centre, tallest) -->
			<rect x="42" y="81" width="12" height="15" fill="#f97316"/>
			<rect x="45" y="75" width="6"  height="9"  fill="#fbbf24"/>
			<rect x="46" y="72" width="4"  height="3"  fill="#fef08a"/>
			<!-- flame 4 -->
			<rect x="57" y="84" width="12" height="12" fill="#f97316"/>
			<rect x="60" y="81" width="6"  height="3"  fill="#fbbf24"/>
			<rect x="63" y="78" width="3"  height="3"  fill="#fef08a"/>
			<!-- flame 5 (right) -->
			<rect x="75" y="87" width="9"  height="9"  fill="#f97316"/>
			<rect x="78" y="84" width="3"  height="3"  fill="#fbbf24"/>

			<!-- flame shimmer animation overlay -->
			<rect x="42" y="78" width="12" height="3"  fill="#fbbf24" class="flame-flicker" opacity="0.8"/>
		{:else}
			<!-- cold stove grate -->
			<rect x="9"  y="90" width="78" height="3"  fill="#1f2937"/>
			<rect x="9"  y="93" width="78" height="9"  fill="#111827"/>
			<rect x="12" y="93" width="3"  height="9"  fill="#1f2937"/>
			<rect x="27" y="93" width="3"  height="9"  fill="#1f2937"/>
			<rect x="42" y="93" width="3"  height="9"  fill="#1f2937"/>
			<rect x="57" y="93" width="3"  height="9"  fill="#1f2937"/>
			<rect x="72" y="93" width="3"  height="9"  fill="#1f2937"/>
		{/if}
	</svg>

	<!-- ═══ Convergence Pressure Gauge ═══ -->
	{#if isActive || isComplete}
		<div class="flex flex-col items-center gap-1">
			<svg width="100" height="60" viewBox="0 0 100 60" style="overflow:visible">
				<!-- background arc -->
				<path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#2a2a2a" stroke-width="7" stroke-linecap="butt"/>
				<!-- fill arc -->
				{#if latestScore > 0}
					<path
						d={describeArc(latestScore)}
						fill="none"
						stroke={gaugeColor}
						stroke-width="7"
						stroke-linecap="butt"
						style="transition: stroke 0.5s;"
					/>
				{/if}
				<!-- tick marks -->
				{#each [0, 25, 50, 75, 100] as pct}
					{@const ang = Math.PI - (pct / 100) * Math.PI}
					<line
						x1={(50 + 44 * Math.cos(ang)).toFixed(1)}
						y1={(50 + 44 * Math.sin(ang)).toFixed(1)}
						x2={(50 + 36 * Math.cos(ang)).toFixed(1)}
						y2={(50 + 36 * Math.sin(ang)).toFixed(1)}
						stroke="#374151"
						stroke-width="1.5"
					/>
				{/each}
				<!-- needle -->
				<g
					transform="translate(50,50) rotate({needleAngle})"
					style="transition: transform 0.8s cubic-bezier(.34,1.56,.64,1);"
				>
					<line x1="0" y1="5" x2="0" y2="-30" stroke={gaugeColor} stroke-width="2" stroke-linecap="round" style="transition: stroke 0.5s;"/>
					<circle cx="0" cy="0" r="4" fill="#111" stroke={gaugeColor} stroke-width="1.5"/>
				</g>
				<!-- score -->
				<text
					x="50" y="54"
					text-anchor="middle"
					font-family="'JetBrains Mono',monospace"
					font-size="11"
					font-weight="bold"
					fill={gaugeColor}
					style="transition: fill 0.5s;"
				>{latestScore}</text>
				<text x="8"  y="58" text-anchor="middle" font-family="monospace" font-size="8" fill="#4b5563">L</text>
				<text x="92" y="58" text-anchor="middle" font-family="monospace" font-size="8" fill="#4b5563">H</text>
			</svg>

			<div class="text-xs font-mono font-semibold min-h-4" style="color:{gaugeColor}; transition: color 0.5s;">
				{pressureLabel}
			</div>

			<!-- Per-round dot trail -->
			{#if convergenceScores.length > 0}
				<div class="flex items-center gap-1.5">
					{#each { length: totalRounds } as _, i}
						{@const score = convergenceScores[i]}
						<div
							class="w-2 h-2 transition-all duration-500 border border-[#2a2a2a]"
							style="background:{score !== undefined ? (score < 30 ? '#ef4444' : score < 60 ? '#f97316' : score < 80 ? '#eab308' : '#22c55e') : '#1a1a1a'}"
							title={score !== undefined ? `Round ${i + 1}: ${score}` : `Round ${i + 1}: pending`}
						></div>
					{/each}
				</div>
			{/if}

			<div class="text-xs text-gray-600 font-mono">Convergence Pressure</div>
		</div>
	{/if}
</div>

<style>
	.pixel-cooker.active {
		filter: drop-shadow(0 0 10px #f9731650);
		animation: pot-throb 2s ease-in-out infinite;
	}
	.pixel-cooker.done {
		filter: drop-shadow(0 0 8px #22c55e50);
	}

	@keyframes pot-throb {
		0%, 100% { filter: drop-shadow(0 0 6px #f9731630); }
		50%       { filter: drop-shadow(0 0 16px #f9731670); }
	}

	/* Steam wisps rise and fade */
	.steam-a { animation: steam-rise 2.0s ease-out 0.0s infinite; }
	.steam-b { animation: steam-rise 1.6s ease-out 0.7s infinite; }
	.steam-c { animation: steam-rise 2.2s ease-out 1.3s infinite; }

	@keyframes steam-rise {
		0%   { opacity: 0.8; transform: translateY(0)   scaleX(1); }
		50%  { opacity: 0.4; }
		100% { opacity: 0;   transform: translateY(-20px) scaleX(1.8); }
	}

	/* Flame flicker */
	.flame-flicker {
		animation: flicker 0.18s steps(2) infinite;
	}
	@keyframes flicker {
		0%   { opacity: 0.9; }
		50%  { opacity: 0.3; }
		100% { opacity: 0.9; }
	}
</style>
