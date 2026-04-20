<script lang="ts">
	import { getModels, isLoading, POPULAR_IDS, POPULAR_GROUPS } from '$lib/stores/models.svelte';
	import type { OpenRouterModel } from '$lib/api/types';
	import ProviderBadge from './ProviderBadge.svelte';

	let {
		open = $bindable(false),
		selected = $bindable(''),
		onselect
	}: {
		open: boolean;
		selected: string;
		onselect: (model: OpenRouterModel) => void;
	} = $props();

	let search = $state('');
	let tab = $state<'popular' | 'all'>('popular');
	let searchInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open && searchInput) {
			setTimeout(() => searchInput?.focus(), 50);
		}
		if (!open) {
			search = '';
			tab = 'popular';
		}
	});

	const allModels = $derived(getModels());
	const loading = $derived(isLoading());

	const popularModels = $derived.by(() => {
		const map = new Map(allModels.map((m) => [m.id, m]));
		return POPULAR_IDS.map((id) => map.get(id)).filter(Boolean) as OpenRouterModel[];
	});

	const filteredAll = $derived.by(() => {
		if (!search) return allModels;
		const q = search.toLowerCase();
		return allModels.filter(
			(m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
		);
	});

	const filteredPopular = $derived.by(() => {
		if (!search) return popularModels;
		const q = search.toLowerCase();
		return popularModels.filter(
			(m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
		);
	});

	const popularByGroup = $derived.by(() =>
		POPULAR_GROUPS.map((g) => ({
			label: g.label,
			models: filteredPopular.filter((m) => m.id.startsWith(g.prefix))
		})).filter((g) => g.models.length > 0)
	);

	function formatPrice(price: string): string {
		const n = parseFloat(price) * 1_000_000;
		if (n === 0) return 'Free';
		return `$${n.toFixed(2)}`;
	}

	function formatCtx(ctx: number): string {
		return ctx >= 1000 ? `${Math.round(ctx / 1000)}K` : String(ctx);
	}

	function select(model: OpenRouterModel) {
		onselect(model);
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

{#snippet modelRow(model: OpenRouterModel)}
	<button
		onclick={() => select(model)}
		class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#222] transition-colors text-left {model.id === selected ? 'border-l-2 border-orange-500 pl-[14px]' : ''}"
	>
		<ProviderBadge modelId={model.id} />
		<div class="flex-1 min-w-0">
			<div class="text-sm text-white truncate">{model.name}</div>
			<div class="text-xs text-gray-600 truncate">{model.id}</div>
		</div>
		<div class="text-right shrink-0">
			<div class="text-xs {parseFloat(model.pricing.prompt) === 0 ? 'text-green-400' : 'text-gray-400'}">
				{formatPrice(model.pricing.prompt)} / {formatPrice(model.pricing.completion)}
			</div>
			<div class="text-xs text-gray-600">{formatCtx(model.context_length)} ctx</div>
		</div>
	</button>
{/snippet}

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		onkeydown={handleKeydown}
		onclick={(e) => { if (e.target === e.currentTarget) open = false; }}
	>
		<div
			class="w-full max-w-[560px] max-h-[70vh] flex flex-col rounded-xl border border-[#2a2a2a] bg-[#111] shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Select a model"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
				<h2 class="text-sm font-semibold text-white">Select a model</h2>
				<button onclick={() => (open = false)} class="text-gray-500 hover:text-white text-lg leading-none">×</button>
			</div>

			<!-- Search -->
			<div class="px-4 py-2 border-b border-[#2a2a2a]">
				<input
					bind:this={searchInput}
					bind:value={search}
					type="text"
					placeholder="Search models..."
					class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500 transition-colors"
				/>
			</div>

			<!-- Tabs -->
			<div class="flex border-b border-[#2a2a2a] px-4">
				{#each (['popular', 'all'] as const) as t}
					<button
						onclick={() => (tab = t)}
						class="py-2 px-3 text-xs font-medium transition-colors capitalize {tab === t ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300'}"
					>
						{t === 'popular' ? 'Popular' : 'All Models'}
					</button>
				{/each}
			</div>

			<!-- List -->
			<div class="overflow-y-auto flex-1 py-2">
				{#if loading}
					<div class="px-4 py-8 text-center text-gray-600 text-sm">Loading models...</div>
				{:else if tab === 'popular'}
					{#each popularByGroup as group}
						<div class="px-4 py-1 text-xs font-semibold text-gray-600 uppercase tracking-wider mt-2">{group.label}</div>
						{#each group.models as model}
							{@render modelRow(model)}
						{/each}
					{/each}
				{:else}
					{#each filteredAll as model}
						{@render modelRow(model)}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
