<script lang="ts">
	import { marked } from 'marked';
	import type { SessionState } from '$lib/api/types';
	import { sessionToMarkdown, downloadFile } from '$lib/utils/export';

	let { session }: { session: SessionState } = $props();

	const html = $derived(session.summaryOutput ? (marked(session.summaryOutput) as string) : '');
	const streaming = $derived(session.summaryStatus === 'streaming');

	function copyAll() {
		navigator.clipboard.writeText(session.summaryOutput);
	}

	function exportMd() {
		const content = sessionToMarkdown(session);
		const slug = session.topic.slice(0, 30).replace(/\s+/g, '-').toLowerCase();
		downloadFile(content, `pressurecooker-${slug}.md`, 'text/markdown');
	}
</script>

<div class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
	<div class="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
		<span class="text-sm font-semibold text-white">✦ Session Summary</span>
		{#if streaming}
			<span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
		{/if}
		<div class="ml-auto flex gap-2">
			<button
				onclick={copyAll}
				class="text-xs text-gray-500 hover:text-white transition-colors"
				title="Copy summary"
			>Copy</button>
			<button
				onclick={exportMd}
				class="text-xs text-gray-500 hover:text-white transition-colors"
				title="Export as Markdown"
			>Export</button>
		</div>
	</div>

	<div class="px-4 py-3">
		{#if session.summaryOutput}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="prose" aria-live="polite">
				{@html html}{#if streaming}<span class="inline-block w-0.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle"></span>{/if}
			</div>
		{:else}
			<p class="text-sm text-gray-600 italic">Generating summary…</p>
		{/if}
	</div>

	{#if session.status === 'complete'}
		<div class="px-4 py-3 border-t border-[#2a2a2a] text-xs text-gray-500 flex flex-wrap gap-3">
			<span>Total actual cost: <span class="text-orange-400 font-semibold">${session.totalActualCost.toFixed(4)}</span></span>
			<span>Rounds: {session.rounds.length}</span>
			<span>Models: {session.llm1Model} + {session.llm2Model}</span>
		</div>
	{/if}
</div>
