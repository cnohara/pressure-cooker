<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { initModels } from '$lib/stores/models.svelte';
	import { initHistory } from '$lib/stores/history.svelte';
	import { getToasts, dismissToast } from '$lib/stores/session.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	const toasts = $derived(getToasts());

	onMount(() => {
		initModels();
		initHistory();
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
			<div class="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm max-w-sm
				{toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' :
				 toast.type === 'warning' ? 'bg-yellow-950 border-yellow-800 text-yellow-200' :
				 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300'}">
				<span class="flex-1">{toast.message}</span>
				<button onclick={() => dismissToast(toast.id)} class="text-current opacity-60 hover:opacity-100">×</button>
			</div>
		{/each}
	</div>
{/if}
