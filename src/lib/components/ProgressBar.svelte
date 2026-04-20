<script lang="ts">
	let {
		current,
		total,
		startedAt
	}: { current: number; total: number; startedAt: string } = $props();

	let elapsed = $state('0s');

	$effect(() => {
		const start = new Date(startedAt).getTime();
		const tick = setInterval(() => {
			const secs = Math.floor((Date.now() - start) / 1000);
			if (secs < 60) elapsed = `${secs}s`;
			else elapsed = `${Math.floor(secs / 60)}m ${secs % 60}s`;
		}, 1000);
		return () => clearInterval(tick);
	});

	const pct = $derived(Math.round((current / total) * 100));
</script>

<div class="flex items-center gap-3" role="status" aria-label="Session progress">
	<span class="text-xs text-gray-400 shrink-0">Round {current} of {total}</span>
	<div class="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
		<div
			class="h-full bg-orange-500 transition-all duration-500 ease-out"
			style="width: {pct}%"
		></div>
	</div>
	<span class="text-xs text-gray-500 shrink-0">{pct}%</span>
	<span class="text-xs text-gray-600 shrink-0">Elapsed: {elapsed}</span>
</div>
