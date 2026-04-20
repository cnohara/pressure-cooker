<script lang="ts">
	import ConfigPanel from '$lib/components/ConfigPanel.svelte';
	import FinalOutputCard from '$lib/components/FinalOutputCard.svelte';
	import RoundTimeline from '$lib/components/RoundTimeline.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StreamingPanel from '$lib/components/StreamingPanel.svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { getSession, resetSession, stopSession } from '$lib/stores/session.svelte';
	import { findModel } from '$lib/stores/models.svelte';

	const session = $derived(getSession());
	const isComplete = $derived(session?.status === 'complete' || session?.status === 'stopped' || session?.status === 'error');
	const totalTokens = $derived.by(() =>
		session?.rounds.reduce((sum, round) => sum + round.builderTokensUsed + round.criticTokensUsed, 0) ?? 0
	);
	const spent = $derived.by(() =>
		session?.rounds.reduce((sum, round) => sum + round.actualCost, 0) ?? session?.totalActualCost ?? 0
	);
	let now = $state(Date.now());
	let autoFollowLatest = $state(true);

	let selectedRoundNumber = $state<number | null>(null);

	$effect(() => {
		if (!session?.rounds.length) {
			selectedRoundNumber = null;
			autoFollowLatest = true;
			return;
		}

		const lastRound = session.rounds[session.rounds.length - 1].roundNumber;
		const existing = selectedRoundNumber
			? session.rounds.find((round) => round.roundNumber === selectedRoundNumber)
			: null;

		if (!existing || autoFollowLatest) selectedRoundNumber = lastRound;
	});

	const selectedRound = $derived.by(() => {
		if (!session?.rounds.length) return null;
		return (
			session.rounds.find((round) => round.roundNumber === selectedRoundNumber) ??
			session.rounds[session.rounds.length - 1]
		);
	});

	const currentRoundNumber = $derived.by(() => session?.rounds[session.rounds.length - 1]?.roundNumber ?? 1);
	const builderModelName = $derived.by(() => (session ? findModel(session.llm1Model)?.name ?? session.llm1Model : ''));
	const criticModelName = $derived.by(() => (session ? findModel(session.llm2Model)?.name ?? session.llm2Model : ''));
	const elapsedSec = $derived.by(() => {
		if (!session?.startedAt) return 0;
		return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
	});

	$effect(() => {
		if (!session) return;
		now = Date.now();
		const timer = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(timer);
	});

	function handleStopOrReset() {
		if (!session) return;
		if (session.status === 'complete' || session.status === 'stopped' || session.status === 'error') {
			resetSession();
			autoFollowLatest = true;
			return;
		}
		stopSession();
	}

	function handleSelectRound(round: number) {
		selectedRoundNumber = round;
		const latestRound = session?.rounds[session.rounds.length - 1]?.roundNumber ?? round;
		autoFollowLatest = round === latestRound;
	}

	function builderStatusLabel() {
		if (!selectedRound) return 'Waiting';
		if (selectedRound.status === 'builder_streaming') return 'Streaming';
		if (!selectedRound.builderOutput) return 'Waiting';
		return 'Delivered';
	}

	function criticStatusLabel() {
		if (!selectedRound) return 'Waiting';
		if (selectedRound.status === 'critic_streaming') return 'Streaming';
		if (!selectedRound.criticOutput) return selectedRound.status === 'builder_streaming' ? 'Waiting' : 'Queued';
		return 'Delivered';
	}

	const finalRound = $derived.by(() => session?.rounds.at(-1) ?? null);
	const showFinalOutput = $derived(
		isComplete || session?.finalBuilderStatus === 'streaming' || session?.finalBuilderStatus === 'complete'
	);
</script>

{#if !session}
	<div class="mx-auto max-w-[1180px] px-6 py-8">
		<div class="mb-8">
			<ConfigPanel collapsed={false} onstarted={() => {}} />
		</div>
	</div>
{:else}
	<div class="px-6 py-6">
		<div class="mx-auto flex max-w-[1440px] gap-0 max-[1180px]:flex-col">
			<Sidebar
				rounds={session.rounds}
				totalRounds={session.totalRounds}
				currentRound={currentRoundNumber}
				sessionStatus={session.status}
				tokens={totalTokens}
				spentUsd={spent}
				elapsedSec={elapsedSec}
				sessionId={session.id}
				startedAt={session.startedAt}
				onStop={handleStopOrReset}
				onSelectRound={handleSelectRound}
			/>

			<div class="min-w-0 flex-1 border border-l-0 border-[var(--line)] bg-[var(--canvas)] max-[1180px]:border-l max-[1180px]:border-t-0">
				<Topbar topic={session.topic} builderModel={builderModelName} criticModel={criticModelName} />
				<RoundTimeline
					rounds={session.rounds}
					totalRounds={session.totalRounds}
					selectedRound={selectedRound?.roundNumber ?? 1}
					onselect={handleSelectRound}
				/>

				{#if session.status === 'error'}
					<div class="mx-6 mt-6 rounded-[3px] border border-[var(--alarm)] bg-[color-mix(in_srgb,var(--alarm)_8%,transparent)] px-4 py-3 text-sm text-[var(--alarm)]">
						{session.errorMessage ?? 'An unexpected error occurred.'}
					</div>
				{/if}

				{#if selectedRound}
					<div class="grid h-[620px] gap-px bg-[var(--line)] max-[980px]:h-auto max-[980px]:grid-cols-1 md:grid-cols-2">
						<div id={`round-${selectedRound.roundNumber}-builder`}>
							<StreamingPanel
								role="builder"
								modelId={builderModelName}
								content={selectedRound.builderOutput}
								streaming={selectedRound.status === 'builder_streaming'}
								waiting={!selectedRound.builderOutput}
								statusLabel={builderStatusLabel()}
								tokens={selectedRound.builderTokensUsed}
								cost={selectedRound.actualCost}
							/>
						</div>
						<div id={`round-${selectedRound.roundNumber}-critic`}>
							<StreamingPanel
								role="critic"
								modelId={criticModelName}
								content={selectedRound.criticOutput}
								streaming={selectedRound.status === 'critic_streaming'}
								waiting={!selectedRound.criticOutput}
								statusLabel={criticStatusLabel()}
								tokens={selectedRound.criticTokensUsed}
								cost={selectedRound.actualCost}
							/>
						</div>
					</div>
				{/if}

				{#if showFinalOutput && session}
					<div class="border-t border-[var(--line)] px-6 py-6">
						<div class={`grid gap-6 ${session.summaryEnabled && session.summaryStatus !== 'idle' ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
							<FinalOutputCard
								title="Final Builder Output"
								content={session.finalBuilderOutput}
								modelId={builderModelName}
								streaming={session.finalBuilderStatus === 'streaming'}
							/>
							{#if session.summaryEnabled && session.summaryStatus !== 'idle'}
								<SummaryCard {session} />
							{/if}
						</div>
					</div>
				{/if}

				{#if isComplete}
					<div class="border-t border-[var(--line)] px-6 py-5">
						<button
							type="button"
							onclick={resetSession}
							class="pc-mono rounded-[2px] border border-[var(--line)] bg-[var(--canvas)] px-4 py-3 text-[11px] uppercase tracking-[0.1em] text-[var(--ink)] transition-colors hover:border-[var(--copper)]"
						>
							New session
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
