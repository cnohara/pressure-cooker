<script lang="ts">
	import { loadKey } from '$lib/utils/storage';
	import { page } from '$app/state';
	import { getTheme, toggleTheme } from '$lib/stores/theme.svelte';

	let keyStored = $state(false);
	const theme = $derived(getTheme());

	$effect(() => {
		keyStored = !!loadKey();
	});
</script>

<nav class="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_92%,transparent)] px-4 backdrop-blur">
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
		<button
			onclick={toggleTheme}
			title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			class="flex h-7 w-7 items-center justify-center rounded-[3px] text-[var(--ink-3)] transition-colors hover:bg-[var(--canvas-2)] hover:text-[var(--ink)]"
		>
			{#if theme === 'dark'}
				<!-- Sun icon -->
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="5"/>
					<line x1="12" y1="1" x2="12" y2="3"/>
					<line x1="12" y1="21" x2="12" y2="23"/>
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
					<line x1="1" y1="12" x2="3" y2="12"/>
					<line x1="21" y1="12" x2="23" y2="12"/>
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
				</svg>
			{:else}
				<!-- Moon icon -->
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
				</svg>
			{/if}
		</button>
	</div>
</nav>
