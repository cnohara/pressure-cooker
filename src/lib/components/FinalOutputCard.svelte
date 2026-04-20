<script lang="ts">
	import { marked } from 'marked';

	let {
		title = 'Final Output',
		content,
		modelId,
		streaming = false
	}: {
		title?: string;
		content: string;
		modelId?: string;
		streaming?: boolean;
	} = $props();

	const html = $derived(content ? (marked(content) as string) : '');

	function copyAll() {
		navigator.clipboard.writeText(content);
	}
</script>

<div class="pc-card overflow-hidden rounded-[3px]">
	<div class="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
		<div>
			<div class="pc-serif text-[22px] text-[var(--ink)]">{title}</div>
			{#if modelId}
				<div class="pc-mono mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">{modelId}</div>
			{/if}
		</div>
		{#if streaming}
			<span class="h-2 w-2 animate-pulse rounded-full bg-[var(--copper)]"></span>
		{/if}
		<div class="ml-auto flex gap-2">
			{#if !streaming}
				<button type="button" onclick={copyAll} class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)] hover:text-[var(--ink)]">Copy</button>
			{/if}
		</div>
	</div>

	<div class="pc-scrollbar max-h-[420px] overflow-y-auto px-5 py-4">
		{#if content}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="pc-prose" aria-live="polite">
				{@html html}{#if streaming}<span class="stream-caret" aria-hidden="true">▋</span>{/if}
			</div>
		{:else if streaming}
			<p class="text-sm italic text-[var(--ink-3)]">Synthesizing final output…</p>
		{:else}
			<p class="text-sm italic text-[var(--ink-3)]">No final output yet.</p>
		{/if}
	</div>
</div>

<style>
	:global(.stream-caret) {
		color: var(--copper);
		animation: blink 0.9s step-end infinite;
	}

	@keyframes blink {
		50% { opacity: 0; }
	}
</style>
