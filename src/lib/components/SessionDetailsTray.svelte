<script lang="ts">
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'pressurecooker_details_open';

	let {
		tokens,
		spentUsd,
		elapsedSec,
		temperature,
		creditsUsd,
		creditsCapacityUsd = 6,
		sessionId,
		startedAt
	}: {
		tokens: number;
		spentUsd: number;
		elapsedSec: number;
		temperature: number;
		creditsUsd: number;
		creditsCapacityUsd?: number;
		sessionId: string;
		startedAt: string;
	} = $props();

	let open = $state(false);

	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		open = saved === 'true';
	}

	function toggleOpen() {
		open = !open;
		if (browser) localStorage.setItem(STORAGE_KEY, String(open));
	}

	const elapsedLabel = $derived.by(() => {
		const mins = Math.floor(elapsedSec / 60);
		const secs = elapsedSec % 60;
		return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
	});

	const tokenLabel = $derived.by(() => {
		if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
		return `${tokens}`;
	});

	const remainingSessions = $derived.by(() => Math.max(0, Math.floor(creditsUsd / Math.max(spentUsd || 0.4, 0.25))));
	const startedMeta = $derived.by(() => {
		const date = new Date(startedAt);
		return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${date.toLocaleDateString([], {
			month: 'short',
			day: 'numeric'
		}).toLowerCase()}`;
	});
</script>

<section class={`details ${open ? 'open' : ''}`}>
	<button type="button" class="details-toggle" onclick={toggleOpen}>
		<span class="details-label">Session details &amp; credits</span>
		<span class="details-bal">${creditsUsd.toFixed(2)}</span>
		<span class="details-chev">▾</span>
	</button>

	<div class="details-body">
		<div class="details-stats">
			<div>
				<div class="pc-kicker">Tokens</div>
				<div class="readout-value">{tokenLabel}<span class="unit">tok</span></div>
			</div>
			<div>
				<div class="pc-kicker">Spent</div>
				<div class="readout-value">${spentUsd.toFixed(2)}<span class="unit">usd</span></div>
			</div>
			<div>
				<div class="pc-kicker">Elapsed</div>
				<div class="readout-value">{elapsedLabel}<span class="unit">min</span></div>
			</div>
			<div>
				<div class="pc-kicker">Temp <span title="LLM sampling temperature - 0 is deterministic, 1.0 is very varied. 0.7 is balanced.">?</span></div>
				<div class="readout-value">{temperature.toFixed(1)}<span class="unit">deg</span></div>
			</div>
		</div>

		<div class="credits-inline">
			<div class="credits-head">
				<span class="pc-kicker">Credits on hand</span>
				<span class="credits-amt">${creditsUsd.toFixed(2)}</span>
			</div>
			<div class="credits-bar">
				<div class="credits-bar-fill" style={`width:${Math.max(0, Math.min(100, (creditsUsd / creditsCapacityUsd) * 100))}%`}></div>
			</div>
			<div class="credits-row">
				<span class="credits-meta">~{remainingSessions} more sessions</span>
				<button type="button" class="btn-topup">Top up <span>→</span></button>
			</div>
		</div>

		<div class="session-id">Session {sessionId.slice(0, 8)} · started {startedMeta}</div>
	</div>
</section>

<style>
	.details {
		margin-top: auto;
		border-top: 1px dashed var(--line-2);
		background: var(--canvas-2);
	}

	.details-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 22px;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-2);
	}

	.details-toggle:hover {
		background: color-mix(in srgb, var(--ink) 4%, transparent);
	}

	.details-label {
		flex: 1;
		text-align: left;
	}

	.details-bal,
	.credits-amt {
		font-family: 'Instrument Serif', Georgia, serif;
		font-size: 14px;
		text-transform: none;
		letter-spacing: 0;
		color: var(--ink);
	}

	.details-chev {
		font-size: 12px;
		transition: transform 0.2s;
	}

	.details.open .details-chev {
		transform: rotate(180deg);
	}

	.details-body {
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.3s ease;
	}

	.details.open .details-body {
		max-height: 400px;
	}

	.details-stats {
		padding: 8px 22px 14px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
		border-bottom: 1px dashed var(--line-2);
	}

	.readout-value {
		font-family: 'Instrument Serif', Georgia, serif;
		font-size: 34px;
		line-height: 1;
		color: var(--ink);
	}

	.unit {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 11px;
		color: var(--ink-3);
		margin-left: 2px;
		font-weight: 500;
	}

	.credits-inline {
		padding: 14px 22px;
		border-bottom: 1px dashed var(--line-2);
	}

	.credits-head,
	.credits-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.credits-bar {
		height: 10px;
		margin: 10px 0 8px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		border: 1px solid var(--line-2);
		border-radius: 2px;
		overflow: hidden;
	}

	.credits-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--copper), var(--copper-2));
	}

	.credits-meta {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 9px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.btn-topup {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border: 1px solid var(--copper-3);
		border-bottom-width: 2px;
		background: var(--copper);
		color: var(--canvas);
		padding: 6px 10px;
		border-radius: 2px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.btn-topup span {
		transition: transform 0.15s;
	}

	.btn-topup:hover span {
		transform: translateX(2px);
	}

	.btn-topup:hover {
		background: var(--copper-2);
	}

	.session-id {
		padding: 10px 22px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 9px;
		color: var(--ink-3);
		letter-spacing: 0.05em;
	}
</style>
