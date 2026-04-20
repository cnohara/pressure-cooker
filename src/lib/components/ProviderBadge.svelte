<script lang="ts">
	let { modelId }: { modelId: string } = $props();

	const PROVIDERS: Record<string, { label: string; bg: string; text: string }> = {
		anthropic: { label: 'A', bg: 'bg-orange-950', text: 'text-orange-300' },
		openai: { label: 'O', bg: 'bg-green-950', text: 'text-green-300' },
		google: { label: 'G', bg: 'bg-blue-950', text: 'text-blue-300' },
		'meta-llama': { label: 'M', bg: 'bg-purple-950', text: 'text-purple-300' },
		mistralai: { label: 'Mi', bg: 'bg-indigo-950', text: 'text-indigo-300' },
		deepseek: { label: 'D', bg: 'bg-cyan-950', text: 'text-cyan-300' },
		qwen: { label: 'Q', bg: 'bg-rose-950', text: 'text-rose-300' }
	};

	const prefix = $derived(modelId.split('/')[0]);
	const provider = $derived(PROVIDERS[prefix] ?? { label: '·', bg: 'bg-gray-800', text: 'text-gray-400' });
</script>

<span class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold font-mono {provider.bg} {provider.text}">
	{provider.label}
</span>
