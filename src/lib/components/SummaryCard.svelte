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

<div class="pc-card rounded-[3px] overflow-hidden">
	<div class="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
		<span class="pc-serif text-[22px] text-[var(--ink)]">Session Summary</span>
		{#if streaming}
			<span class="h-2 w-2 animate-pulse rounded-full bg-[var(--copper)]"></span>
		{/if}
		<div class="ml-auto flex gap-2">
			<button type="button" onclick={copyAll} class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)] hover:text-[var(--ink)]">Copy</button>
			<button type="button" onclick={exportMd} class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)] hover:text-[var(--ink)]">Export</button>
		</div>
	</div>

	<div class="px-5 py-4">
		{#if session.summaryOutput}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="pc-prose" aria-live="polite">
				{@html html}{#if streaming}<span class="stream-caret" aria-hidden="true">▋</span>{/if}
			</div>
		{:else}
			<p class="text-sm italic text-[var(--ink-3)]">Generating summary…</p>
		{/if}
	</div>

	<div class="pc-mono flex flex-wrap gap-3 border-t border-[var(--line)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
		<span>Total cost: ${session.totalActualCost.toFixed(4)}</span>
		<span>Rounds: {session.rounds.length}</span>
		<span>{session.llm1Model} + {session.llm2Model}</span>
	</div>
</div>

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
