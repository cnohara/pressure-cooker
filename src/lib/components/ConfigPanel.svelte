<script lang="ts">
	import { validateKey } from '$lib/api/openrouter';
	import { loadKey, saveKey } from '$lib/utils/storage';
	import { findModel } from '$lib/stores/models.svelte';
	import ModelPickerModal from './ModelPickerModal.svelte';
	import CostEstimate from './CostEstimate.svelte';
	import ProviderBadge from './ProviderBadge.svelte';
	import type { OpenRouterModel } from '$lib/api/types';
	import { startSession } from '$lib/stores/session.svelte';

	let {
		collapsed = false,
		onstarted
	}: { collapsed: boolean; onstarted: () => void } = $props();

	let apiKey = $state(loadKey());
	let keyStatus = $state<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
	let llm1Id = $state('anthropic/claude-sonnet-4-5');
	let llm2Id = $state('google/gemini-2.0-flash-001');
	let llm1Instruction = $state(
		'You are an expert planner. Create a detailed, thorough plan for: {topic}. Consider all edge cases, interactions, and failure modes.'
	);
	let llm2Instruction = $state(
		'You are a rigorous critic. Identify every flaw, gap, missed edge case, and logical error in this plan. Be thorough and specific. Do not suggest fixes — only identify problems.'
	);
	let topic = $state('');
	let rounds = $state(3);
	let summaryEnabled = $state(true);
	let pauseBetweenRounds = $state(false);

	let picker1Open = $state(false);
	let picker2Open = $state(false);

	let errors = $state<Record<string, string>>({});
	let isStarting = $state(false);

	$effect(() => {
		if (apiKey && loadKey() === apiKey) {
			keyStatus = 'valid';
		}
	});

	async function onKeyBlur() {
		if (!apiKey) { keyStatus = 'idle'; return; }
		keyStatus = 'checking';
		const valid = await validateKey(apiKey);
		keyStatus = valid ? 'valid' : 'invalid';
		if (valid) saveKey(apiKey);
	}

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!apiKey || keyStatus !== 'valid') e.apiKey = 'A valid API key is required.';
		if (!llm1Id) e.llm1 = 'Select a Builder model.';
		if (!llm2Id) e.llm2 = 'Select a Critic model.';
		if (!llm1Instruction.trim()) e.llm1Instruction = 'Builder instruction is required.';
		if (!llm2Instruction.trim()) e.llm2Instruction = 'Critic instruction is required.';
		if (!topic.trim()) e.topic = 'Topic is required.';
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleStart() {
		if (!validate()) return;
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
	}

	const llm1Model = $derived(findModel(llm1Id));
	const llm2Model = $derived(findModel(llm2Id));
</script>

<div class="transition-all duration-300 overflow-hidden {collapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'}">
	<div class="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-5">

		<!-- API Key -->
		<div>
			<label class="block text-xs font-semibold text-gray-400 mb-1.5" for="apikey">
				OpenRouter API Key
			</label>
			<div class="relative">
				<input
					id="apikey"
					type="password"
					bind:value={apiKey}
					onblur={onKeyBlur}
					placeholder="sk-or-..."
					class="w-full bg-[#111] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors pr-8
						{errors.apiKey ? 'border-red-500' : keyStatus === 'valid' ? 'border-green-700' : 'border-[#2a2a2a] focus:border-orange-500'}"
				/>
				{#if keyStatus === 'checking'}
					<span class="absolute right-2.5 top-2.5 text-gray-500 text-xs">...</span>
				{:else if keyStatus === 'valid'}
					<span class="absolute right-2.5 top-2.5 text-green-500 text-sm">✓</span>
				{:else if keyStatus === 'invalid'}
					<span class="absolute right-2.5 top-2.5 text-red-500 text-sm">✗</span>
				{/if}
			</div>
			{#if errors.apiKey}
				<p class="text-xs text-red-400 mt-1">{errors.apiKey}</p>
			{/if}
			<a href="https://openrouter.ai/keys" target="_blank" class="text-xs text-gray-600 hover:text-orange-400 transition-colors mt-1 inline-block">
				Get a key →
			</a>
		</div>

		<!-- Models row -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Builder -->
			<div>
				<div class="block text-xs font-semibold text-gray-400 mb-1.5">Builder</div>
				<button
					onclick={() => (picker1Open = true)}
					class="w-full flex items-center gap-2 bg-[#111] border rounded-lg px-3 py-2 text-sm text-white transition-colors
						{errors.llm1 ? 'border-red-500' : 'border-[#2a2a2a] hover:border-orange-500'}"
				>
					{#if llm1Id}
						<ProviderBadge modelId={llm1Id} />
						<span class="truncate text-left">{llm1Model?.name ?? llm1Id}</span>
					{:else}
						<span class="text-gray-600">Select model…</span>
					{/if}
				</button>
				{#if errors.llm1}<p class="text-xs text-red-400 mt-1">{errors.llm1}</p>{/if}
			</div>

			<!-- Critic -->
			<div>
				<div class="block text-xs font-semibold text-gray-400 mb-1.5">Critic</div>
				<button
					onclick={() => (picker2Open = true)}
					class="w-full flex items-center gap-2 bg-[#111] border rounded-lg px-3 py-2 text-sm text-white transition-colors
						{errors.llm2 ? 'border-red-500' : 'border-[#2a2a2a] hover:border-orange-500'}"
				>
					{#if llm2Id}
						<ProviderBadge modelId={llm2Id} />
						<span class="truncate text-left">{llm2Model?.name ?? llm2Id}</span>
					{:else}
						<span class="text-gray-600">Select model…</span>
					{/if}
				</button>
				{#if errors.llm2}<p class="text-xs text-red-400 mt-1">{errors.llm2}</p>{/if}
			</div>
		</div>

		<!-- Instructions -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-gray-400 mb-1.5" for="llm1inst">
					Builder instruction
					<span class="ml-1 text-gray-600 font-normal" title="Use {'{topic}'} to insert the session topic">ⓘ</span>
				</label>
				<textarea
					id="llm1inst"
					bind:value={llm1Instruction}
					rows="4"
					class="w-full bg-[#111] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none transition-colors
						{errors.llm1Instruction ? 'border-red-500' : 'border-[#2a2a2a] focus:border-orange-500'}"
				></textarea>
				{#if errors.llm1Instruction}<p class="text-xs text-red-400 mt-1">{errors.llm1Instruction}</p>{/if}
			</div>
			<div>
				<label class="block text-xs font-semibold text-gray-400 mb-1.5" for="llm2inst">Critic instruction</label>
				<textarea
					id="llm2inst"
					bind:value={llm2Instruction}
					rows="4"
					class="w-full bg-[#111] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none transition-colors
						{errors.llm2Instruction ? 'border-red-500' : 'border-[#2a2a2a] focus:border-orange-500'}"
				></textarea>
				{#if errors.llm2Instruction}<p class="text-xs text-red-400 mt-1">{errors.llm2Instruction}</p>{/if}
			</div>
		</div>

		<!-- Topic -->
		<div>
			<label class="block text-xs font-semibold text-gray-400 mb-1.5" for="topic">Topic</label>
			<input
				id="topic"
				type="text"
				bind:value={topic}
				placeholder="A fully playable Godot platformer game"
				class="w-full bg-[#111] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors
					{errors.topic ? 'border-red-500' : 'border-[#2a2a2a] focus:border-orange-500'}"
			/>
			{#if errors.topic}<p class="text-xs text-red-400 mt-1">{errors.topic}</p>{/if}
		</div>

		<!-- Rounds -->
		<div>
			<label class="block text-xs font-semibold text-gray-400 mb-1.5" for="rounds">Rounds</label>
			<div class="flex items-center gap-3">
				<input id="rounds" type="range" min="1" max="10" bind:value={rounds} class="flex-1 accent-orange-500" />
				<span class="font-mono text-orange-400 text-lg font-bold w-20">{rounds} rounds</span>
			</div>
		</div>

		<!-- Toggles -->
		<div class="flex flex-col gap-2">
			<label class="flex items-start gap-2 cursor-pointer">
				<input type="checkbox" bind:checked={summaryEnabled} class="mt-0.5 accent-orange-500" />
				<div>
					<span class="text-sm text-gray-300">Generate summary after final round</span>
					<span class="block text-xs text-gray-600">(Uses a fast cheap model — cost included in estimate)</span>
				</div>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" bind:checked={pauseBetweenRounds} class="accent-orange-500" />
				<span class="text-sm text-gray-300">Pause between rounds (lets you edit instructions)</span>
			</label>
		</div>

		<!-- Cost Estimate -->
		<CostEstimate {llm1Id} {llm2Id} {rounds} {topic} {llm1Instruction} {llm2Instruction} {summaryEnabled} />

		<!-- Start Button -->
		<button
			onclick={handleStart}
			disabled={isStarting}
			class="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm transition-all duration-200"
		>
			{isStarting ? 'Starting…' : '🔥 Pressure Cook'}
		</button>
	</div>
</div>

<ModelPickerModal
	bind:open={picker1Open}
	bind:selected={llm1Id}
	onselect={(m) => { llm1Id = m.id; }}
/>
<ModelPickerModal
	bind:open={picker2Open}
	bind:selected={llm2Id}
	onselect={(m) => { llm2Id = m.id; }}
/>
