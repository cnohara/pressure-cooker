<script lang="ts">
	import { loadKey } from '$lib/utils/storage';
	import { page } from '$app/state';

	let keyStored = $state(false);

	$effect(() => {
		keyStored = !!loadKey();
	});
</script>

<nav class="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-[var(--line)] bg-[rgba(242,235,222,0.92)] px-4 backdrop-blur">
	<a href="/" class="flex items-center gap-2 no-underline">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="text-[var(--copper)]">
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"></circle>
			<circle cx="12" cy="12" r="2" fill="currentColor"></circle>
			<line x1="12" y1="12" x2="17" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></line>
			<line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></line>
			<line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></line>
			<line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></line>
			<line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></line>
		</svg>
		<span class="pc-serif text-[22px] text-[var(--ink)]">PressureCooker</span>
	</a>

	<div class="flex items-center gap-4">
		<a
			href="/history"
			class={`text-sm transition-colors ${page.url?.pathname === '/history' ? 'text-[var(--ink)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
		>History</a>
		<div class="flex items-center gap-1.5 text-xs">
			<span class={`h-2 w-2 rounded-full ${keyStored ? 'bg-[var(--cool)]' : 'bg-[var(--line-2)]'}`}></span>
			<span class={keyStored ? 'text-[var(--ink-2)]' : 'text-[var(--ink-3)]'}>{keyStored ? 'API key set' : 'No API key'}</span>
		</div>
	</div>
</nav>
