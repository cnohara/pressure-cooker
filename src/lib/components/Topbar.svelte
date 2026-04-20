<script lang="ts">
	let {
		topic,
		builderModel,
		criticModel
	}: {
		topic: string;
		builderModel: string;
		criticModel: string;
	} = $props();
</script>

<div class="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-6 py-5">
	<div class="min-w-0 max-w-3xl">
		<div class="pc-kicker mb-1">Topic</div>
		<div class="pc-serif text-[22px] leading-[1.3] text-[var(--ink)]">{topic}</div>
	</div>

	<div class="flex items-center gap-2 self-start">
		<div class="pc-mono flex items-center gap-2 rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)]">
			<span class="border-l-[3px] border-[var(--builder)] pl-2">Builder</span>
			<span class="max-w-[180px] truncate text-[var(--ink)] normal-case tracking-normal">{builderModel}</span>
		</div>
		<div class="pc-mono flex items-center gap-2 rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-2)]">
			<span class="border-l-[3px] border-[var(--critic)] pl-2">Critic</span>
			<span class="max-w-[180px] truncate text-[var(--ink)] normal-case tracking-normal">{criticModel}</span>
		</div>
		<button type="button" aria-label="Session settings" class="grid h-9 w-9 place-items-center rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] text-[var(--ink-2)]">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
				<circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"></circle>
				<path d="M7 1v2M7 11v2M13 7h-2M3 7H1M11.2 2.8l-1.4 1.4M4.2 9.8l-1.4 1.4M11.2 11.2l-1.4-1.4M4.2 4.2L2.8 2.8" stroke="currentColor" stroke-width="1.3"></path>
			</svg>
		</button>
	</div>
</div>
