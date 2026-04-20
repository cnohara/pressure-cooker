<script lang="ts">
	import { loadKey } from '$lib/utils/storage';
	import { page } from '$app/state';

	let keyStored = $state(false);

	$effect(() => {
		keyStored = !!loadKey();
	});
</script>

<nav class="fixed top-0 left-0 right-0 z-50 h-12 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 flex items-center justify-between">
	<a href="/" class="flex items-center gap-2 no-underline">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="text-orange-500">
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
			<circle cx="12" cy="12" r="2" fill="currentColor"/>
			<line x1="12" y1="12" x2="17" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			<line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			<line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			<line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			<line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		</svg>
		<span class="font-mono text-sm font-semibold text-white">PressureCooker</span>
	</a>

	<div class="flex items-center gap-4">
		<a
			href="/history"
			class="text-sm text-gray-400 hover:text-white transition-colors"
			class:text-white={page.url?.pathname === '/history'}
		>History</a>
		<div class="flex items-center gap-1.5 text-xs">
			{#if keyStored}
				<span class="w-2 h-2 rounded-full bg-green-500"></span>
				<span class="text-gray-500">API key set</span>
			{:else}
				<span class="w-2 h-2 rounded-full bg-gray-600"></span>
				<span class="text-gray-600">No API key</span>
			{/if}
		</div>
	</div>
</nav>
