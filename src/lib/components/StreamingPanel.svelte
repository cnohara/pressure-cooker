<script lang="ts">
	import { marked } from 'marked';

	marked.setOptions({ gfm: true, breaks: true });

	let {
		label,
		modelId,
		content,
		streaming = false,
		waiting = false,
		waitingLabel = 'Waiting...'
	}: {
		label: string;
		modelId: string;
		content: string;
		streaming?: boolean;
		waiting?: boolean;
		waitingLabel?: string;
	} = $props();

	const html = $derived(content ? (marked(content) as string) : '');
</script>

<div class="flex flex-col h-full min-h-0 relative {streaming ? 'streaming-panel' : ''}">
	<div class="flex items-center gap-2 px-4 py-2 border-b border-[#2a2a2a] shrink-0">
		<span class="text-xs font-semibold text-gray-400">{label}</span>
		<span class="text-xs text-gray-600 truncate">{modelId}</span>
		{#if streaming}
			<span class="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
		{/if}
	</div>
	<div class="flex-1 overflow-y-auto px-4 py-3 text-sm">
		{#if waiting && !content}
			<p class="text-gray-600 italic">{waitingLabel}</p>
		{:else if content}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="prose" aria-live="polite">{@html html}{#if streaming}<span class="inline-block w-0.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle"></span>{/if}</div>
		{/if}
	</div>
</div>

<style>
	.streaming-panel {
		box-shadow: inset 0 0 0 1px #f97316;
		border-radius: 0;
	}
</style>
