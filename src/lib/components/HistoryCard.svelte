<script lang="ts">
	import type { SessionState } from '$lib/api/types';
	import { removeSession } from '$lib/stores/history.svelte';
	import { sessionToMarkdown, downloadFile } from '$lib/utils/export';

	let {
		session,
		onclick
	}: { session: SessionState; onclick: () => void } = $props();

	let confirmDelete = $state(false);

	const statusColor: Record<string, string> = {
		complete: 'bg-green-900 text-green-300',
		stopped: 'bg-yellow-900 text-yellow-300',
		error: 'bg-red-900 text-red-300'
	};

	function exportMd(e: MouseEvent) {
		e.stopPropagation();
		const content = sessionToMarkdown(session);
		const slug = session.topic.slice(0, 30).replace(/\s+/g, '-').toLowerCase();
		downloadFile(content, `pressurecooker-${slug}.md`, 'text/markdown');
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		if (confirmDelete) {
			removeSession(session.id);
		} else {
			confirmDelete = true;
			setTimeout(() => (confirmDelete = false), 3000);
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick()}
	class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 hover:border-[#3a3a3a] transition-colors cursor-pointer"
>
	<div class="flex items-start justify-between gap-3">
		<div class="flex-1 min-w-0">
			<div class="text-sm font-medium text-white truncate">{session.topic}</div>
			<div class="text-xs text-gray-500 mt-0.5">
				{new Date(session.startedAt).toLocaleString()} · {session.rounds.length} rounds · ${session.totalActualCost.toFixed(4)}
			</div>
			<div class="text-xs text-gray-600 mt-0.5 truncate">
				{session.llm1Model} vs {session.llm2Model}
			</div>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<span class="text-xs px-2 py-0.5 rounded-full {statusColor[session.status] ?? 'bg-gray-800 text-gray-400'}">
				{session.status}
			</span>
			<button
				onclick={exportMd}
				class="text-xs text-gray-600 hover:text-white transition-colors"
				title="Export as Markdown"
			>⬇</button>
			<button
				onclick={handleDelete}
				class="text-xs {confirmDelete ? 'text-red-400' : 'text-gray-600 hover:text-red-400'} transition-colors"
				title="Delete session"
			>
				{confirmDelete ? 'Confirm?' : '✕'}
			</button>
		</div>
	</div>
</div>
