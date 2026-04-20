<script lang="ts">
	import { updated } from '$app/state';
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
	let showUpdateToast = $state(false);
	let updateDismissed = $state(false);

	async function checkForAppUpdate() {
		try {
			const hasUpdate = await updated.check();
			if (hasUpdate && !updateDismissed) {
				showUpdateToast = true;
			}
		} catch (error) {
			console.error('Failed to check for app updates', error);
		}
	}

	function reloadForUpdate() {
		window.location.reload();
	}

	function dismissUpdateToast() {
		updateDismissed = true;
		showUpdateToast = false;
	}

	onMount(() => {
		initModels();
		initHistory();
		initTheme();

		void checkForAppUpdate();

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && !updateDismissed) {
				void checkForAppUpdate();
			}
		};

		const handleFocus = () => {
			if (!updateDismissed) {
				void checkForAppUpdate();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('focus', handleFocus);
		};
	});

	$effect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	$effect(() => {
		if (updated.current && !updateDismissed) {
			showUpdateToast = true;
		}
	});
</script>

<svelte:head>
	<title>PressureCooker</title>
	<!-- Runs synchronously before first paint to prevent theme flash -->
	{@html `<script>
		(function(){
			var s = localStorage.getItem('pressurecooker_theme');
			var dark = s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches);
			if (dark) document.documentElement.classList.add('dark');
		})();
	</script>`}
</svelte:head>

<Nav />

<main class="pt-16 min-h-screen">
	{@render children()}
</main>

<!-- Toast notifications -->
{#if toasts.length > 0}
	<div class={`fixed right-4 flex flex-col gap-2 z-50 ${showUpdateToast ? 'bottom-36' : 'bottom-4'}`}>
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

{#if showUpdateToast}
	<div class="fixed bottom-4 right-4 z-[60] w-[min(24rem,calc(100vw-2rem))] rounded-[4px] border border-[var(--copper)] bg-[var(--canvas)] p-4 text-sm text-[var(--ink)] shadow-[0_18px_40px_color-mix(in_srgb,var(--ink)_18%,transparent)]">
		<div class="mb-3">
			<div class="pc-kicker mb-1 text-[var(--copper-3)]">Update available</div>
			<p class="m-0 leading-6 text-[var(--ink-2)]">
				A newer version of PressureCooker is live. Reload to get the latest update.
			</p>
		</div>
		<div class="flex items-center justify-end gap-2">
			<button
				type="button"
				class="rounded-[3px] border border-[var(--line)] px-3 py-1.5 text-[var(--ink-2)] transition hover:border-[var(--line-2)] hover:text-[var(--ink)]"
				onclick={dismissUpdateToast}
			>
				Later
			</button>
			<button
				type="button"
				class="rounded-[3px] border border-[var(--copper)] bg-[var(--copper)] px-3 py-1.5 font-medium text-[var(--canvas)] transition hover:bg-[var(--copper-2)] hover:border-[var(--copper-2)]"
				onclick={reloadForUpdate}
			>
				Reload
			</button>
		</div>
	</div>
{/if}
