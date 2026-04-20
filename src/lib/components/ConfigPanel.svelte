<script lang="ts">
	import {
		DEFAULT_SESSION_PRESET_ID,
		type SessionPreset,
		type SessionPresetId,
		SESSION_PRESETS,
		getSessionPreset
	} from '$lib/config/sessionPresets';
	import { findModel } from '$lib/stores/models.svelte';
	import { startSession } from '$lib/stores/session.svelte';
	import { loadKey } from '$lib/utils/storage';
	import CostEstimate from './CostEstimate.svelte';
	import ModelPickerModal from './ModelPickerModal.svelte';
	import ProviderBadge from './ProviderBadge.svelte';

	let {
		collapsed = false,
		onstarted
	}: { collapsed: boolean; onstarted: () => void } = $props();

	const initialPreset = getSessionPreset(DEFAULT_SESSION_PRESET_ID);

	let selectedPresetId = $state<SessionPresetId>(initialPreset.id);
	let pendingPresetId = $state<SessionPresetId | null>(null);
	let llm1Id = $state('anthropic/claude-sonnet-4-5');
	let llm2Id = $state('google/gemini-2.0-flash-001');
	let llm1Instruction = $state(initialPreset.builderInstruction);
	let llm2Instruction = $state(initialPreset.criticInstruction);
	let topic = $state('');
	let topicPlaceholder = $state(initialPreset.topicPlaceholder);
	let rounds = $state(initialPreset.defaults.rounds);
	let summaryEnabled = $state(initialPreset.defaults.generateSummary);
	let pauseBetweenRounds = $state(initialPreset.defaults.pauseBetweenRounds);

	let picker1Open = $state(false);
	let picker2Open = $state(false);

	let errors = $state<Record<string, string>>({});
	let isStarting = $state(false);

	const selectedPreset = $derived(getSessionPreset(selectedPresetId));
	const pendingPreset = $derived.by(() =>
		pendingPresetId ? getSessionPreset(pendingPresetId) : null
	);
	const llm1Model = $derived(findModel(llm1Id));
	const llm2Model = $derived(findModel(llm2Id));
	const isPresetCustomized = $derived.by(() => {
		const preset = selectedPreset;
		return (
			llm1Instruction !== preset.builderInstruction ||
			llm2Instruction !== preset.criticInstruction ||
			rounds !== preset.defaults.rounds ||
			pauseBetweenRounds !== preset.defaults.pauseBetweenRounds ||
			summaryEnabled !== preset.defaults.generateSummary
		);
	});

	function applyPreset(preset: SessionPreset) {
		selectedPresetId = preset.id;
		llm1Instruction = preset.builderInstruction;
		llm2Instruction = preset.criticInstruction;
		topicPlaceholder = preset.topicPlaceholder;
		rounds = preset.defaults.rounds;
		pauseBetweenRounds = preset.defaults.pauseBetweenRounds;
		summaryEnabled = preset.defaults.generateSummary;
		pendingPresetId = null;
	}

	function handlePresetSelection(nextId: string) {
		const preset = getSessionPreset(nextId as SessionPresetId);
		if (!preset || preset.id === selectedPresetId) return;

		if (isPresetCustomized) {
			pendingPresetId = preset.id;
			return;
		}

		applyPreset(preset);
	}

	function cancelPresetSwitch() {
		pendingPresetId = null;
	}

	function confirmPresetSwitch() {
		if (!pendingPreset) return;
		applyPreset(pendingPreset);
	}

	function validate(): boolean {
		const next: Record<string, string> = {};
		const apiKey = loadKey();
		if (!apiKey) next.apiKey = 'Set your OpenRouter key via the nav menu.';
		if (!llm1Id) next.llm1 = 'Choose a Builder model.';
		if (!llm2Id) next.llm2 = 'Choose a Critic model.';
		if (!llm1Instruction.trim()) next.llm1Instruction = 'Builder instruction is required.';
		if (!llm2Instruction.trim()) next.llm2Instruction = 'Critic instruction is required.';
		if (!topic.trim()) next.topic = 'Give the session a topic.';
		errors = next;
		return Object.keys(next).length === 0;
	}

	async function handleStart() {
		if (!validate()) return;
		const apiKey = loadKey();
		if (!apiKey) return;
		isStarting = true;
		await startSession({
			apiKey,
			llm1Model: llm1Id,
			llm2Model: llm2Id,
			llm1Instruction,
			llm2Instruction,
			topic,
			totalRounds: rounds,
			summaryEnabled,
			pauseBetweenRounds
		});
		isStarting = false;
		onstarted();
	}
</script>

<div class={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'}`}>
	<div class="pc-card rounded-[3px] bg-[var(--canvas-2)] p-6 shadow-[0_18px_40px_color-mix(in_srgb,var(--ink)_8%,transparent)]">
		<div class="mb-6">
			<div class="pc-kicker mb-2">Session setup</div>
			<h2 class="pc-serif text-[34px] leading-none text-[var(--ink)]">Set the pot</h2>
			<p class="mt-2 text-sm leading-6 text-[var(--ink-2)]">
				Pick a session mode, then swap models or edit the prompts however you like.
			</p>
		</div>

		{#if errors.apiKey}
			<div class="mb-5 flex items-center gap-2 rounded-[3px] border border-[var(--alarm)] bg-[color-mix(in_srgb,var(--alarm)_8%,transparent)] px-4 py-3 text-sm text-[var(--alarm)]">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
				{errors.apiKey}
			</div>
		{/if}

		<div class="space-y-6">
			<!-- 1. Session Mode -->
			<div class="rounded-[3px] border border-[var(--line)] bg-[var(--canvas)] p-4">
				<div class="mb-3 flex flex-wrap items-center gap-3">
					<label class="pc-kicker block" for="session-mode">Session Mode</label>
					{#if isPresetCustomized}
						<span class="pc-mono rounded-[999px] border border-[var(--line)] px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
							Customized
						</span>
					{/if}
				</div>
				<select
					id="session-mode"
					value={selectedPresetId}
					onchange={(event) => handlePresetSelection((event.currentTarget as HTMLSelectElement).value)}
					class="w-full rounded-[3px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--copper)]"
				>
					{#each SESSION_PRESETS as preset}
						<option value={preset.id}>{preset.name}</option>
					{/each}
				</select>
				<div class="mt-3 text-sm leading-6 text-[var(--ink-2)]">{selectedPreset.shortDescription}</div>

				{#if pendingPreset}
					<div class="mt-4 rounded-[3px] border border-[var(--copper)] bg-[color-mix(in_srgb,var(--copper)_8%,transparent)] p-4">
						<div class="pc-mono text-[10px] uppercase tracking-[0.1em] text-[var(--copper-3)]">Apply new mode?</div>
						<p class="mt-2 text-sm leading-6 text-[var(--ink-2)]">
							Switching to <span class="text-[var(--ink)]">{pendingPreset.name}</span> will replace the current Builder instruction,
							Critic instruction, rounds, and session options. Your typed topic will stay.
						</p>
						<div class="mt-3 flex gap-2">
							<button
								type="button"
								onclick={confirmPresetSwitch}
								class="pc-mono rounded-[2px] border border-[var(--copper-3)] bg-[var(--copper)] px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--canvas)] transition-colors hover:bg-[var(--copper-2)]"
							>
								Apply preset
							</button>
							<button
								type="button"
								onclick={cancelPresetSwitch}
								class="pc-mono rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--ink)]"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- 2. Topic -->
			<div>
				<label class="pc-kicker mb-2 block" for="topic">Topic</label>
				<input
					id="topic"
					type="text"
					bind:value={topic}
					placeholder={topicPlaceholder}
					class={`pc-serif w-full rounded-[3px] border bg-[var(--canvas)] px-4 py-4 text-[22px] leading-[1.3] text-[var(--ink)] outline-none transition-colors placeholder:text-[18px] placeholder:text-[var(--ink-3)] ${
						errors.topic ? 'border-[var(--alarm)]' : 'border-[var(--line)] focus:border-[var(--copper)]'
					}`}
				/>
				{#if errors.topic}<p class="mt-1 text-xs text-[var(--alarm)]">{errors.topic}</p>{/if}
			</div>

			<!-- 3. Builder + Critic -->
			<div class="grid gap-5 md:grid-cols-2">
				<div class="space-y-3">
					<div class="pc-kicker">Builder</div>
					<button
						type="button"
						onclick={() => (picker1Open = true)}
						class={`flex w-full items-center gap-2 rounded-[3px] border bg-[var(--canvas)] px-3 py-2.5 text-sm text-[var(--ink)] transition-colors ${
							errors.llm1 ? 'border-[var(--alarm)]' : 'border-[var(--line)] hover:border-[var(--copper)]'
						}`}
					>
						{#if llm1Id}
							<ProviderBadge modelId={llm1Id} />
							<span class="truncate text-left">{llm1Model?.name ?? llm1Id}</span>
						{:else}
							<span class="text-[var(--ink-3)]">Select model…</span>
						{/if}
					</button>
					{#if errors.llm1}<p class="text-xs text-[var(--alarm)]">{errors.llm1}</p>{/if}
					<textarea
						id="llm1inst"
						bind:value={llm1Instruction}
						rows="10"
						class={`w-full resize-none rounded-[3px] border bg-[var(--canvas)] px-3 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors ${
							errors.llm1Instruction ? 'border-[var(--alarm)]' : 'border-[var(--line)] focus:border-[var(--copper)]'
						}`}
					></textarea>
					{#if errors.llm1Instruction}<p class="text-xs text-[var(--alarm)]">{errors.llm1Instruction}</p>{/if}
				</div>

				<div class="space-y-3">
					<div class="pc-kicker">Critic</div>
					<button
						type="button"
						onclick={() => (picker2Open = true)}
						class={`flex w-full items-center gap-2 rounded-[3px] border bg-[var(--canvas)] px-3 py-2.5 text-sm text-[var(--ink)] transition-colors ${
							errors.llm2 ? 'border-[var(--alarm)]' : 'border-[var(--line)] hover:border-[var(--copper)]'
						}`}
					>
						{#if llm2Id}
							<ProviderBadge modelId={llm2Id} />
							<span class="truncate text-left">{llm2Model?.name ?? llm2Id}</span>
						{:else}
							<span class="text-[var(--ink-3)]">Select model…</span>
						{/if}
					</button>
					{#if errors.llm2}<p class="text-xs text-[var(--alarm)]">{errors.llm2}</p>{/if}
					<textarea
						id="llm2inst"
						bind:value={llm2Instruction}
						rows="10"
						class={`w-full resize-none rounded-[3px] border bg-[var(--canvas)] px-3 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors ${
							errors.llm2Instruction ? 'border-[var(--alarm)]' : 'border-[var(--line)] focus:border-[var(--copper)]'
						}`}
					></textarea>
					{#if errors.llm2Instruction}<p class="text-xs text-[var(--alarm)]">{errors.llm2Instruction}</p>{/if}
				</div>
			</div>

			<!-- 4. Rounds -->
			<div class="rounded-[3px] border border-[var(--line)] bg-[var(--canvas)] p-4">
				<div class="mb-3 flex items-center justify-between">
					<label class="pc-kicker" for="rounds">Rounds</label>
					<span class="pc-serif text-[28px] leading-none text-[var(--ink)]">{rounds}</span>
				</div>
				<input
					id="rounds"
					type="range"
					min="1"
					max="10"
					bind:value={rounds}
					class="w-full accent-[var(--copper)]"
				/>
				<div class="mt-2 flex justify-between text-[10px] text-[var(--ink-3)]">
					<span>1 — quick</span>
					<span>10 — thorough</span>
				</div>
			</div>

			<!-- 5. Options -->
			<div class="flex flex-wrap gap-x-8 gap-y-3">
				<label class="flex items-center gap-2 text-sm text-[var(--ink-2)]">
					<input type="checkbox" bind:checked={summaryEnabled} class="accent-[var(--copper)]" />
					Generate a post-session summary
				</label>
				<label class="flex items-center gap-2 text-sm text-[var(--ink-2)]">
					<input type="checkbox" bind:checked={pauseBetweenRounds} class="accent-[var(--copper)]" />
					Pause between rounds to edit instructions
				</label>
			</div>

			<!-- 6. Cost + Cook -->
			<div class="flex items-end justify-between gap-6 border-t border-[var(--line)] pt-5">
				<div class="text-xs text-[var(--ink-3)]">
					<CostEstimate {llm1Id} {llm2Id} {rounds} {topic} {llm1Instruction} {llm2Instruction} {summaryEnabled} />
				</div>
				<button
					type="button"
					onclick={handleStart}
					disabled={isStarting}
					class="pc-mono shrink-0 rounded-[2px] border border-[var(--copper-3)] bg-[var(--copper)] px-8 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--canvas)] transition-colors hover:bg-[var(--copper-2)] disabled:opacity-50"
				>
					{isStarting ? 'Starting…' : 'Pressure cook'}
				</button>
			</div>
		</div>
	</div>
</div>

<ModelPickerModal bind:open={picker1Open} bind:selected={llm1Id} onselect={(m) => { llm1Id = m.id; }} />
<ModelPickerModal bind:open={picker2Open} bind:selected={llm2Id} onselect={(m) => { llm2Id = m.id; }} />
