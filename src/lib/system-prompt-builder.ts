import { KB_01, KB_02, KB_03, KB_04 } from './kb-constants';
import { getModeKB, SKILLS_KB } from './kb-mode-loader';

export interface KBToggles {
  kb01: boolean;
  kb02: boolean;
  kb03: boolean;
  kb04: boolean;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
}

export const DEFAULT_KB_TOGGLES: KBToggles = {
  kb01: true,
  kb02: true,
  kb03: true,
  kb04: true,
};

export function buildSystemPrompt(params: {
  systemPromptBase: string;
  kbToggles: KBToggles;
  memoryItems: MemoryItem[];
  activeMode: string;
  userName: string;
  isBrutalHonesty: boolean;
  projectContext?: string | null;
}): string {
  const { systemPromptBase, kbToggles, memoryItems, activeMode, userName, isBrutalHonesty, projectContext } = params;
  const parts: string[] = [];

  parts.push(`[COCKROACH AGENT SYSTEM PROMPT]\n${systemPromptBase}`);

  if (kbToggles.kb01) parts.push(`[KB-01: IDENTITY & PERSONALITY]\n${KB_01}`);
  if (kbToggles.kb02) parts.push(`[KB-02: IDEA ANALYSIS FRAMEWORK]\n${KB_02}`);
  if (kbToggles.kb03) parts.push(`[KB-03: USA FUNDING & GRANTS]\n${KB_03}`);
  if (kbToggles.kb04) parts.push(`[KB-04: OUTPUT FORMATS & STRUCTURE]\n${KB_04}`);

  // Always-on skills KB — enterprise-grade PPT/XLSX/PDF craft. Cockroach
  // should never produce a half-finished deliverable when asked for a report.
  parts.push(`[SKILLS KB — Reports, Decks, Models, Charts]\n${SKILLS_KB}`);

  // Mode-specific KB injected based on the active working mode. These are
  // orthogonal to KB_01-04 (which are always-on foundations) — the mode KB
  // tells Cockroach HOW to behave in this specific workflow.
  const modeKB = getModeKB(activeMode);
  if (modeKB) {
    parts.push(`[MODE KB — ${activeMode}]\n${modeKB}`);
  }

  if (projectContext) {
    parts.push(`[PROJECT CONTEXT]\n${projectContext}\n[/PROJECT CONTEXT]`);
  }

  if (memoryItems.length > 0) {
    const memLines = memoryItems.map(item => `- [${item.category}]: ${item.content}`);
    parts.push(
      `[COCKROACH MEMORY CONTEXT]\nLast updated: ${new Date().toISOString()}\n\n${memLines.join('\n')}\n[/COCKROACH MEMORY CONTEXT]`,
    );
  }

  parts.push(`CURRENT OPERATING MODE: ${activeMode}`);
  parts.push(`The user is ${userName}.`);

  if (isBrutalHonesty) {
    parts.push('CRITICAL: BRUTAL HONESTY MODE IS ON. Respond with brutal honesty, explicitly highlighting critical flaws, blindspots, and weak assumptions without sugar-coating.');
  }

  return parts.join('\n\n---\n\n');
}
