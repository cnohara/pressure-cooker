<script lang="ts">
	import { validateKey } from '$lib/api/openrouter';
	import { loadKey, saveKey } from '$lib/utils/storage';
	import { page } from '$app/state';
	import { getTheme, toggleTheme } from '$lib/stores/theme.svelte';

	let keyStored = $state(!!loadKey());
	let keyPanelOpen = $state(false);
	let apiKey = $state(loadKey() ?? '');
	let keyStatus = $state<'idle' | 'checking' | 'valid' | 'invalid'>(loadKey() ? 'valid' : 'idle');
	const theme = $derived(getTheme());

	async function onKeyBlur() {
		if (!apiKey) {
			keyStatus = 'idle';
			return;
		}
		keyStatus = 'checking';
		const valid = await validateKey(apiKey);
		keyStatus = valid ? 'valid' : 'invalid';
		if (valid) {
			saveKey(apiKey);
			keyStored = true;
		}
	}

	function closePanel() {
		keyPanelOpen = false;
	}
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

	<div class="flex items-center gap-3">
		<a
			href="/history"
			class={`text-sm transition-colors ${page.url?.pathname === '/history' ? 'text-[var(--ink)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
		>History</a>

		<!-- API key toggle -->
		<div class="relative">
			<button
				onclick={() => (keyPanelOpen = !keyPanelOpen)}
				class={`flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs transition-colors ${
					keyStored
						? 'border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--copper)] hover:text-[var(--ink)]'
						: 'border-[var(--alarm)] text-[var(--alarm)] hover:bg-[color-mix(in_srgb,var(--alarm)_8%,transparent)]'
				}`}
			>
				<span class={`h-1.5 w-1.5 rounded-full ${keyStored ? 'bg-[var(--cool)]' : 'bg-[var(--alarm)]'}`}></span>
				{keyStored ? 'API key' : 'Set API key'}
			</button>

			{#if keyPanelOpen}
				<!-- Backdrop -->
				<button
					class="fixed inset-0 z-40 cursor-default"
					onclick={closePanel}
					aria-label="Close"
					tabindex="-1"
				></button>

				<!-- Popover -->
				<div class="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-[4px] border border-[var(--line)] bg-[var(--canvas-2)] p-4 shadow-[0_8px_24px_color-mix(in_srgb,var(--ink)_12%,transparent)]">
					<div class="pc-kicker mb-3">OpenRouter API Key</div>
					<div class="relative">
						<input
							type="password"
							bind:value={apiKey}
							onblur={onKeyBlur}
							placeholder="sk-or-..."
							class={`w-full rounded-[3px] border bg-[var(--canvas)] px-3 py-2.5 pr-8 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-3)] ${
								keyStatus === 'valid'
									? 'border-[var(--cool)]'
									: keyStatus === 'invalid'
										? 'border-[var(--alarm)]'
										: 'border-[var(--line)] focus:border-[var(--copper)]'
							}`}
						/>
						{#if keyStatus === 'checking'}
							<span class="absolute right-2.5 top-2.5 text-xs text-[var(--ink-3)]">…</span>
						{:else if keyStatus === 'valid'}
							<span class="absolute right-2.5 top-2.5 text-sm text-[var(--cool)]">✓</span>
						{:else if keyStatus === 'invalid'}
							<span class="absolute right-2.5 top-2.5 text-sm text-[var(--alarm)]">✗</span>
						{/if}
					</div>
					{#if keyStatus === 'invalid'}
						<p class="mt-1.5 text-xs text-[var(--alarm)]">Key not recognized by OpenRouter.</p>
					{/if}
					<a href="https://openrouter.ai/keys" target="_blank" class="mt-2 inline-block text-xs text-[var(--copper-3)] underline">
						Get a key
					</a>
				</div>
			{/if}
		</div>

		<!-- Theme toggle -->
		<button
			onclick={toggleTheme}
			title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			class="flex h-7 w-7 items-center justify-center rounded-[3px] text-[var(--ink-3)] transition-colors hover:bg-[var(--canvas-2)] hover:text-[var(--ink)]"
		>
			{#if theme === 'dark'}
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
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
				</svg>
			{/if}
		</button>
	</div>
</nav>
