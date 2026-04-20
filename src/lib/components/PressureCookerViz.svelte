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

	// Average of all available convergence scores
	const latestScore = $derived(() => {
		const scored = convergenceScores.filter((s): s is number => s !== undefined);
		if (!scored.length) return 0;
		return scored[scored.length - 1];
	});

	const avgScore = $derived(() => {
		const scored = convergenceScores.filter((s): s is number => s !== undefined);
		if (!scored.length) return 0;
		return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
	});

	// Gauge arc: semicircle, 180° sweep
	// needle rotates from -90deg (0%) to +90deg (100%)
	const needleAngle = $derived(-90 + latestScore() * 1.8);

	// Color based on score
	const gaugeColor = $derived(() => {
		const s = latestScore();
		if (s < 30) return '#ef4444';   // red
		if (s < 60) return '#f97316';   // orange
		if (s < 80) return '#eab308';   // yellow
		return '#22c55e';               // green
	});

	// Arc path for SVG gauge fill
	function arcPath(pct: number): string {
		const cx = 60, cy = 60, r = 44;
		const startAngle = Math.PI; // left (0%)
		const endAngle = startAngle - (pct / 100) * Math.PI; // sweeps right
		const x1 = cx + r * Math.cos(startAngle);
		const y1 = cy + r * Math.sin(startAngle);
		const x2 = cx + r * Math.cos(endAngle);
		const y2 = cy + r * Math.sin(endAngle);
		const largeArc = pct > 50 ? 1 : 0;
		return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
	}

	const label = $derived(() => {
		if (!isActive && !isComplete) return '';
		const s = latestScore();
		if (s < 20) return 'Raw';
		if (s < 45) return 'Heating';
		if (s < 65) return 'Simmering';
		if (s < 80) return 'Pressurized';
		if (s < 95) return 'Nearly Done';
		return 'Fully Cooked';
	});
</script>

<div class="flex flex-col items-center gap-3 select-none">
	<!-- Pixel art pressure cooker -->
	<div class="relative" style="width:120px;height:120px">
		<!-- Pot body (isometric pixel art via CSS) -->
		<div class="cooker-wrap" class:active={isActive} class:done={isComplete}>
			<!-- Top face -->
			<div class="face top-face"></div>
			<!-- Front face -->
			<div class="face front-face"></div>
			<!-- Right face -->
			<div class="face right-face"></div>
			<!-- Lid -->
			<div class="face lid"></div>
			<!-- Handle left -->
			<div class="handle left-handle"></div>
			<!-- Handle right -->
			<div class="handle right-handle"></div>
			<!-- Pressure knob -->
			<div class="knob" class:spinning={isActive}></div>
			<!-- Gauge window on front -->
			<div class="gauge-window">
				<div class="gauge-fill" style="width:{(latestScore()/100)*100}%"></div>
			</div>
		</div>

		<!-- Steam wisps -->
		{#if isActive}
			<div class="steam-container">
				<div class="steam s1"></div>
				<div class="steam s2"></div>
				<div class="steam s3"></div>
			</div>
		{/if}

		<!-- Completion burst -->
		{#if isComplete}
			<div class="completion-ring"></div>
		{/if}
	</div>

	<!-- Arc pressure gauge -->
	{#if isActive || isComplete}
		<div class="flex flex-col items-center gap-1">
			<svg width="120" height="68" viewBox="0 0 120 68" class="overflow-visible">
				<!-- Background arc -->
				<path
					d={arcPath(100)}
					fill="none"
					stroke="#2a2a2a"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<!-- Fill arc -->
				<path
					d={arcPath(latestScore())}
					fill="none"
					stroke={gaugeColor()}
					stroke-width="8"
					stroke-linecap="round"
					class="gauge-arc-fill"
				/>
				<!-- Needle -->
				<g transform="translate(60,60) rotate({needleAngle})">
					<line x1="0" y1="0" x2="0" y2="-36" stroke={gaugeColor()} stroke-width="2" stroke-linecap="round" />
					<circle cx="0" cy="0" r="3" fill={gaugeColor()} />
				</g>
				<!-- Score text -->
				<text x="60" y="58" text-anchor="middle" class="gauge-score" fill={gaugeColor()}>
					{latestScore()}
				</text>
				<!-- Labels -->
				<text x="14" y="66" text-anchor="middle" font-size="8" fill="#4b5563">0</text>
				<text x="106" y="66" text-anchor="middle" font-size="8" fill="#4b5563">100</text>
			</svg>

			<div class="text-xs font-mono" style="color:{gaugeColor()}">{label()}</div>

			<!-- Round dots -->
			{#if convergenceScores.length > 0}
				<div class="flex items-center gap-1 mt-1">
					{#each { length: totalRounds } as _, i}
						{@const score = convergenceScores[i]}
						<div
							class="w-2 h-2 rounded-full transition-all duration-500"
							style="background:{score !== undefined ? (score < 30 ? '#ef4444' : score < 60 ? '#f97316' : score < 80 ? '#eab308' : '#22c55e') : '#2a2a2a'}"
							title={score !== undefined ? `Round ${i+1}: ${score}%` : `Round ${i+1}`}
						></div>
					{/each}
				</div>
			{/if}

			<div class="text-xs text-gray-600">Convergence Pressure</div>
		</div>
	{/if}
</div>

<style>
	.cooker-wrap {
		position: relative;
		width: 80px;
		height: 80px;
		margin: 20px auto 0;
		transform-style: preserve-3d;
		transition: filter 0.5s;
	}

	.cooker-wrap.active {
		filter: drop-shadow(0 0 10px #f9731680) drop-shadow(0 0 20px #f9731640);
		animation: pot-pulse 2s ease-in-out infinite;
	}

	.cooker-wrap.done {
		filter: drop-shadow(0 0 8px #22c55e80);
	}

	@keyframes pot-pulse {
		0%, 100% { filter: drop-shadow(0 0 8px #f9731660) drop-shadow(0 0 16px #f9731630); }
		50% { filter: drop-shadow(0 0 16px #f97316aa) drop-shadow(0 0 32px #f9731660); }
	}

	/* Isometric pixel pot faces */
	.face {
		position: absolute;
		image-rendering: pixelated;
	}

	.top-face {
		width: 60px;
		height: 20px;
		background: #6b7280;
		top: 10px;
		left: 10px;
		transform: skewX(-30deg);
		border: 1px solid #374151;
	}

	.front-face {
		width: 50px;
		height: 40px;
		background: #374151;
		top: 26px;
		left: 10px;
		border: 1px solid #1f2937;
	}

	.right-face {
		width: 22px;
		height: 40px;
		background: #1f2937;
		top: 26px;
		left: 58px;
		transform: skewY(-30deg);
		border: 1px solid #111827;
	}

	.lid {
		width: 64px;
		height: 12px;
		background: #4b5563;
		top: 6px;
		left: 8px;
		transform: skewX(-30deg);
		border: 1px solid #374151;
	}

	.handle {
		position: absolute;
		width: 8px;
		height: 14px;
		background: #9ca3af;
		border: 1px solid #6b7280;
		border-radius: 2px;
	}

	.left-handle {
		top: 30px;
		left: 2px;
	}

	.right-handle {
		top: 30px;
		left: 70px;
	}

	.knob {
		position: absolute;
		width: 10px;
		height: 10px;
		background: #d97706;
		border: 1px solid #92400e;
		border-radius: 50%;
		top: 0px;
		left: 35px;
		transition: all 0.3s;
	}

	.knob.spinning {
		animation: knob-spin 1.5s linear infinite;
		background: #f97316;
		box-shadow: 0 0 6px #f97316;
	}

	@keyframes knob-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.gauge-window {
		position: absolute;
		width: 24px;
		height: 8px;
		background: #111;
		border: 1px solid #4b5563;
		top: 38px;
		left: 18px;
		border-radius: 2px;
		overflow: hidden;
	}

	.gauge-fill {
		height: 100%;
		background: #f97316;
		transition: width 1s ease-out;
	}

	/* Steam wisps */
	.steam-container {
		position: absolute;
		top: 0px;
		left: 30px;
		pointer-events: none;
	}

	.steam {
		position: absolute;
		width: 6px;
		border-radius: 50%;
		background: rgba(255,255,255,0.15);
		animation: steam-rise 2s ease-in infinite;
		filter: blur(3px);
	}

	.s1 { width: 8px; height: 20px; left: 0px; animation-delay: 0s; }
	.s2 { width: 6px; height: 16px; left: 12px; animation-delay: 0.6s; }
	.s3 { width: 5px; height: 14px; left: 24px; animation-delay: 1.2s; }

	@keyframes steam-rise {
		0% { opacity: 0; transform: translateY(0) scaleX(1); }
		20% { opacity: 0.7; }
		100% { opacity: 0; transform: translateY(-40px) scaleX(2.5); }
	}

	/* Completion ring */
	.completion-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 80px;
		height: 80px;
		margin: -40px 0 0 -40px;
		border-radius: 50%;
		border: 2px solid #22c55e;
		animation: ring-expand 0.6s ease-out forwards;
		pointer-events: none;
	}

	@keyframes ring-expand {
		0% { transform: scale(0.5); opacity: 1; }
		100% { transform: scale(2); opacity: 0; }
	}

	/* SVG gauge */
	.gauge-arc-fill {
		transition: stroke-dashoffset 0.8s ease-out, stroke 0.5s;
	}

	.gauge-score {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		font-weight: bold;
	}
</style>
