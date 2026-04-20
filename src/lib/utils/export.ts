import type { SessionState } from '$lib/api/types';

export function sessionToMarkdown(s: SessionState): string {
	const date = new Date(s.startedAt).toLocaleString();
	let md = `# PressureCooker Session
**Topic:** ${s.topic}
**Date:** ${date}
**Models:** ${s.llm1Model} (Builder) vs ${s.llm2Model} (Critic)
**Rounds:** ${s.rounds.length}
**Total Cost:** $${s.totalActualCost.toFixed(4)}

---

## Builder Instruction
${s.llm1Instruction}

## Critic Instruction
${s.llm2Instruction}

---
`;

	for (const round of s.rounds) {
		md += `
## Round ${round.roundNumber}

### Plan
${round.builderOutput}

### Critique
${round.criticOutput}

---
`;
	}

	if (s.summaryOutput) {
		md += `
## Summary
${s.summaryOutput}
`;
	}

	return md;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
