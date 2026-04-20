<script lang="ts">
	import { marked } from 'marked';

	let {
		title = 'Final Output',
		content,
		modelId,
		streaming = false,
		canContinue = false,
		continueRounds = 2,
		continueBusy = false,
		onContinue
	}: {
		title?: string;
		content: string;
		modelId?: string;
		streaming?: boolean;
		canContinue?: boolean;
		continueRounds?: number;
		continueBusy?: boolean;
		onContinue?: (rounds: number) => void;
	} = $props();

	let roundsToAdd = $state(2);

	$effect(() => {
		roundsToAdd = continueRounds;
	});

	const html = $derived(content ? (marked(content) as string) : '');

	function copyAll() {
		navigator.clipboard.writeText(content);
	}

	function handleContinue() {
		onContinue?.(roundsToAdd);
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

	{#if canContinue && !streaming}
		<div class="border-t border-[var(--line)] bg-[var(--canvas-2)] px-5 py-4">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="min-w-0 flex-1">
					<div class="pc-kicker mb-2">Keep going</div>
					<p class="mb-3 text-sm leading-6 text-[var(--ink-2)]">
						Run a few more Builder/Critic rounds, then synthesize a stronger final output.
					</p>
					<div class="flex items-center justify-between">
						<label class="pc-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]" for="continue-rounds">Extra rounds</label>
						<span class="pc-serif text-[28px] leading-none text-[var(--ink)]">{roundsToAdd}</span>
					</div>
					<input
						id="continue-rounds"
						type="range"
						min="1"
						max="10"
						bind:value={roundsToAdd}
						class="mt-2 w-full accent-[var(--copper)]"
					/>
				</div>
				<button
					type="button"
					onclick={handleContinue}
					disabled={continueBusy}
					class="pc-mono shrink-0 rounded-[2px] border border-[var(--copper-3)] bg-[var(--copper)] px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--canvas)] transition-colors hover:bg-[var(--copper-2)] disabled:opacity-50"
				>
					{continueBusy ? 'Continuing…' : 'Keep cooking'}
				</button>
			</div>
		</div>
	{/if}
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
