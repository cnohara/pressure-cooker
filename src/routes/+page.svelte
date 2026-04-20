<script lang="ts">
	import ConfigPanel from '$lib/components/ConfigPanel.svelte';
	import RoundCard from '$lib/components/RoundCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
	import PressureCookerViz from '$lib/components/PressureCookerViz.svelte';
	import { getSession, stopSession, resetSession } from '$lib/stores/session.svelte';

	const session = $derived(getSession());
	const isRunning = $derived(session?.status === 'running' || session?.status === 'paused');
	const isComplete = $derived(session?.status === 'complete' || session?.status === 'stopped');
	const convergenceScores = $derived(session?.rounds.map((r) => r.convergenceScore) ?? []);
</script>

<div class="max-w-[860px] mx-auto px-4 py-8 space-y-6">

	<!-- Config Panel -->
	<ConfigPanel collapsed={!!session && !isComplete} onstarted={() => {}} />

	<!-- "New session" button when complete -->
	{#if isComplete}
		<div class="flex justify-center">
			<button
				onclick={resetSession}
				class="text-sm text-gray-500 hover:text-orange-400 transition-colors border border-[#2a2a2a] rounded-lg px-4 py-2"
			>
				+ New Session
			</button>
		</div>
	{/if}

	{#if session}
		<!-- Progress + Viz row -->
		{#if isRunning || isComplete}
			<div class="flex items-start gap-6">
				<!-- Left: progress + stop -->
				<div class="flex-1 space-y-3 pt-2">
					{#if isRunning}
						<ProgressBar
							current={session.rounds.length}
							total={session.totalRounds}
							startedAt={session.startedAt}
						/>
						<div class="flex justify-end">
							<button
								onclick={stopSession}
								class="bg-red-900 hover:bg-red-800 text-red-200 rounded-lg px-4 py-2 text-sm transition-all"
							>
								■ Stop
							</button>
						</div>
					{/if}

					<!-- Status messages -->
					{#if session.status === 'stopped'}
						<p class="text-sm text-yellow-500">Session stopped. Partial output saved to history.</p>
					{:else if session.status === 'error'}
						<p class="text-sm text-red-400">{session.errorMessage ?? 'An error occurred.'}</p>
					{:else if session.status === 'complete'}
						<p class="text-sm text-green-400">✓ Session complete.</p>
					{/if}
				</div>

				<!-- Right: pressure cooker viz -->
				<div class="shrink-0">
					<PressureCookerViz
						{convergenceScores}
						totalRounds={session.totalRounds}
						sessionStatus={session.status}
					/>
				</div>
			</div>
		{/if}

		<!-- Round Cards -->
		<div class="space-y-3">
			{#each session.rounds as round, i (round.roundNumber)}
				<RoundCard
					{round}
					totalRounds={session.totalRounds}
					llm1Model={session.llm1Model}
					llm2Model={session.llm2Model}
					llm1Instruction={session.llm1Instruction}
					llm2Instruction={session.llm2Instruction}
					sessionStatus={session.status}
					isLast={i === session.rounds.length - 1}
				/>
			{/each}
		</div>

		<!-- Summary Card -->
		{#if session.summaryEnabled && session.summaryStatus !== 'idle'}
			<SummaryCard {session} />
		{/if}
	{/if}
</div>
