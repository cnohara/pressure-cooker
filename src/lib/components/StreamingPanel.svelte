<script lang="ts">
	import { marked } from 'marked';

	marked.setOptions({ gfm: true, breaks: true });

	let {
		role,
		modelId,
		content,
		streaming = false,
		waiting = false,
		statusLabel,
		tokens = 0,
		cost = 0
	}: {
		role: 'builder' | 'critic';
		modelId: string;
		content: string;
		streaming?: boolean;
		waiting?: boolean;
		statusLabel: string;
		tokens?: number;
		cost?: number;
	} = $props();

	const html = $derived.by(() => {
		const base = content ? (marked(content) as string) : '';
		return streaming ? `${base}<span class="stream-caret" aria-hidden="true">▋</span>` : base;
	});

	let scrollEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (streaming && scrollEl) {
			scrollEl.scrollTop = scrollEl.scrollHeight;
		}
	});

	const roleColor = $derived(role === 'builder' ? 'var(--builder)' : 'var(--critic)');
	const roleLabel = $derived(role === 'builder' ? 'Builder' : 'Critic');
	const roleInitial = $derived(role === 'builder' ? 'B' : 'C');
</script>

<section class="flex h-[620px] min-h-0 min-w-0 flex-col bg-[rgba(242,235,222,0.78)] max-[980px]:h-[420px]">
	<div class="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
		<div class="flex items-center gap-3">
			<div class="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-[var(--canvas)]" style={`background:${roleColor}`}>{roleInitial}</div>
			<div class="min-w-0">
				<div class="pc-serif text-[22px] leading-none text-[var(--ink)]">{roleLabel}</div>
				<div class="pc-mono mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">{modelId}</div>
			</div>
		</div>

		<div
			class={`pc-mono inline-flex items-center gap-2 rounded-[999px] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${
				streaming
					? 'bg-[var(--ink)] text-[var(--canvas)]'
					: waiting
						? 'bg-[var(--canvas-2)] text-[var(--ink-3)]'
						: 'bg-[var(--canvas-2)] text-[var(--ink)]'
			}`}
		>
			{#if streaming}
				<span class="h-1.5 w-1.5 rounded-full bg-[var(--copper-2)] animate-pulse"></span>
			{/if}
			{statusLabel}
		</div>
	</div>

	<div bind:this={scrollEl} class="pc-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
		{#if waiting && !content}
			<p class="text-sm italic text-[var(--ink-3)]">Waiting for output…</p>
		{:else if content}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="pc-prose break-words" aria-live="polite">{@html html}</div>
		{:else}
			<p class="text-sm italic text-[var(--ink-3)]">Nothing here yet.</p>
		{/if}
	</div>

	<div class="pc-mono flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
		<span>{tokens.toLocaleString()} tokens</span>
		<span>${cost.toFixed(4)}</span>
	</div>
</section>

<style>
	:global(.stream-caret) {
		color: var(--copper);
		animation: blink 0.9s step-end infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
