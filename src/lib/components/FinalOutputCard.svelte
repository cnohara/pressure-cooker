<script lang="ts">
	import { marked } from 'marked';

	let {
		title = 'Final Output',
		content,
		modelId
	}: {
		title?: string;
		content: string;
		modelId?: string;
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
		<div class="ml-auto flex gap-2">
			<button type="button" onclick={copyAll} class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)] hover:text-[var(--ink)]">Copy</button>
		</div>
	</div>

	<div class="pc-scrollbar max-h-[420px] overflow-y-auto px-5 py-4">
		{#if content}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="pc-prose">{@html html}</div>
		{:else}
			<p class="text-sm italic text-[var(--ink-3)]">No final output yet.</p>
		{/if}
	</div>
</div>
