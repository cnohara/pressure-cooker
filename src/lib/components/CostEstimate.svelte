<script lang="ts">
	import { estimateCost } from '$lib/utils/tokens';
	import { findModel, getCheapestPopular } from '$lib/stores/models.svelte';

	let {
		llm1Id,
		llm2Id,
		rounds,
		topic,
		llm1Instruction,
		llm2Instruction,
		summaryEnabled
	}: {
		llm1Id: string;
		llm2Id: string;
		rounds: number;
		topic: string;
		llm1Instruction: string;
		llm2Instruction: string;
		summaryEnabled: boolean;
	} = $props();

	const estimate = $derived(() => {
		const llm1 = findModel(llm1Id) ?? null;
		const llm2 = findModel(llm2Id) ?? null;
		const summary = summaryEnabled ? getCheapestPopular() : null;
		return estimateCost(llm1, llm2, rounds, topic, llm1Instruction, llm2Instruction, summaryEnabled, summary);
	});
</script>

<div class="text-xs text-gray-500 space-y-1">
	<div>
		Estimated cost:
		<span class="text-orange-400 font-semibold">${estimate().total.toFixed(4)}</span>
		<span class="ml-2 text-gray-600">
			[LLM1: ${estimate().llm1.toFixed(4)} | LLM2: ${estimate().llm2.toFixed(4)}{#if summaryEnabled} | Summary: ${estimate().summary.toFixed(4)}{/if}]
		</span>
	</div>
	<div class="text-gray-600">Based on ~800 output tokens/response. Actual cost may vary.</div>
	{#if estimate().contextWarning}
		<div class="text-yellow-500 flex items-center gap-1">
			⚠ Round {estimate().contextWarning!.round} may approach context limit for {estimate().contextWarning!.model} ({estimate().contextWarning!.tokens}K tokens).
		</div>
	{/if}
</div>
