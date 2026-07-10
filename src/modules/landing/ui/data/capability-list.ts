import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Handshake, Layers, ScrollText, ShieldCheck, Timer } from 'lucide-react'

export interface Capability {
  code: string
  title: string
  description: string
  icon: LucideIcon
}

/**
 * The six capabilities surfaced on the landing page — each one maps 1:1 to a
 * project non-negotiable from CLAUDE.md so the marketing surface never drifts
 * from what the system actually is.
 */
export const capabilities: Capability[] = [
  {
    code: '01',
    title: 'Citations or nothing',
    description:
      'Every turn cites ≥1 retrieved source_id. Hallucinated IDs are dropped. Zero validated citations → forced escalation.',
    icon: BadgeCheck,
  },
  {
    code: '02',
    title: 'Code controls safety',
    description:
      'Tool allowlist, severity classification, escalation, and the must-retrieve guardrail run in deterministic Python — never delegated to the LLM.',
    icon: ShieldCheck,
  },
  {
    code: '03',
    title: 'Decision support only',
    description:
      'Suggests probable root causes and next actions. The only write is a tracking ticket — no autonomous remediation against banking systems.',
    icon: Handshake,
  },
  {
    code: '04',
    title: 'Hybrid retrieval',
    description:
      'pgvector + BM25 fused with Reciprocal Rank Fusion (k=60) across curated and per-user KBs. Same embedder end-to-end (text-embedding-004).',
    icon: Layers,
  },
  {
    code: '05',
    title: 'Immutable audit trail',
    description:
      'One AuditRecord per trace_id — previews only ([:200] / [:500]). PII redacted at the boundary. PDPL-aligned.',
    icon: ScrollText,
  },
  {
    code: '06',
    title: 'Severity-keyed budgets',
    description:
      'P1/P2 turn budget 150s · P3/P4 180s. Escalation thresholds are coded per severity — classification is a heuristic, not an LLM guess.',
    icon: Timer,
  },
]
