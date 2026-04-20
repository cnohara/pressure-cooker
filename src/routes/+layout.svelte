<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { initModels } from '$lib/stores/models.svelte';
	import { initHistory } from '$lib/stores/history.svelte';
	import { getToasts, dismissToast } from '$lib/stores/session.svelte';
	import { initTheme, getTheme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	const toasts = $derived(getToasts());
	const theme = $derived(getTheme());

	onMount(() => {
		initModels();
		initHistory();
		initTheme();
	});

	$effect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<svelte:head>
	<title>PressureCooker</title>
</svelte:head>

<Nav />

<main class="pt-16 min-h-screen">
	{@render children()}
</main>

<!-- Toast notifications -->
{#if toasts.length > 0}
	<div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
		{#each toasts as toast (toast.id)}
			<div class="flex max-w-sm items-center gap-2 rounded-[3px] border px-4 py-2.5 text-sm shadow-[0_12px_24px_color-mix(in_srgb,var(--ink)_12%,transparent)]
				{toast.type === 'error' ? 'border-[var(--alarm)] bg-[color-mix(in_srgb,var(--alarm)_8%,transparent)] text-[var(--alarm)]' :
				 toast.type === 'warning' ? 'border-[var(--copper)] bg-[color-mix(in_srgb,var(--copper)_8%,transparent)] text-[var(--copper-3)]' :
				 'border-[var(--line)] bg-[var(--canvas)] text-[var(--ink-2)]'}">
				<span class="flex-1">{toast.message}</span>
				<button onclick={() => dismissToast(toast.id)} class="text-current opacity-60 hover:opacity-100">×</button>
			</div>
		{/each}
	</div>
{/if}
