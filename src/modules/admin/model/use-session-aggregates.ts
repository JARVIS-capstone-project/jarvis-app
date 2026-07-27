import { useMemo } from 'react'

/**
 * Aggregates flat turn rows into session-level summaries. The BE audit
 * endpoints return one row per turn; the UI cares about sessions, so we
 * group + compute in-memory. Assumes rows are already sorted newest-first
 * (both agent and platform sources return that order).
 *
 * Severity numeric mapping: P1=4 (most critical), P4=1 (least). Nulls are
 * excluded from the average — a session with only null severities gets
 * `avgSeverity = null` and the card should skip that meter.
 */
export interface RawTurn {
  trace_id?: string
  session_id?: string
  user_id?: string
  severity?: 'P1' | 'P2' | 'P3' | 'P4' | null
  user_message_preview?: string
  response_preview?: string
  tool_calls?: string[]
  confidence_score?: number
  requires_escalation?: boolean
  created_at?: string
}

export interface SessionSummary {
  sessionId: string
  turnCount: number
  avgConfidence: number | null
  avgSeverity: number | null
  worstSeverity: 'P1' | 'P2' | 'P3' | 'P4' | null
  firstUserPreview: string | null
  latestResponsePreview: string | null
  newestAt: string | null
  anyEscalation: boolean
}

const SEV_NUMERIC: Record<'P1' | 'P2' | 'P3' | 'P4', number> = {
  P1: 4,
  P2: 3,
  P3: 2,
  P4: 1,
}

/**
 * Coerce whatever shape the endpoint returned into a plain array of turns.
 * Platform returns `{ items, total }`; agent returns a bare array. Anything
 * else → empty array (the card grid renders an empty state).
 */
export function normalizeTurns(payload: unknown): RawTurn[] {
  if (Array.isArray(payload)) return payload as RawTurn[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: RawTurn[] }).items
  }
  return []
}

export function aggregateSessions(turns: RawTurn[]): SessionSummary[] {
  const bySession = new Map<string, SessionSummary & { _confSum: number; _confCount: number; _sevSum: number; _sevCount: number }>()

  for (const t of turns) {
    const sid = t.session_id
    if (!sid) continue
    let s = bySession.get(sid)
    if (!s) {
      s = {
        sessionId: sid,
        turnCount: 0,
        avgConfidence: null,
        avgSeverity: null,
        worstSeverity: null,
        firstUserPreview: null,
        latestResponsePreview: null,
        newestAt: null,
        anyEscalation: false,
        _confSum: 0,
        _confCount: 0,
        _sevSum: 0,
        _sevCount: 0,
      }
      bySession.set(sid, s)
    }
    s.turnCount += 1
    if (typeof t.confidence_score === 'number') {
      s._confSum += t.confidence_score
      s._confCount += 1
    }
    if (t.severity && t.severity in SEV_NUMERIC) {
      s._sevSum += SEV_NUMERIC[t.severity]
      s._sevCount += 1
      // Higher numeric = worse. Keep the worst seen.
      if (!s.worstSeverity || SEV_NUMERIC[t.severity] > SEV_NUMERIC[s.worstSeverity]) {
        s.worstSeverity = t.severity
      }
    }
    if (t.requires_escalation) s.anyEscalation = true
    // Turns arrive newest-first. The FIRST time we see a session_id, its
    // row is the newest — capture the response preview + timestamp. Later
    // rows for the same session are OLDER — overwrite firstUserPreview so
    // by the end it holds the OLDEST user message (the session opener).
    if (s.latestResponsePreview === null && t.response_preview) {
      s.latestResponsePreview = t.response_preview
    }
    if (s.newestAt === null && t.created_at) {
      s.newestAt = t.created_at
    }
    if (t.user_message_preview) s.firstUserPreview = t.user_message_preview
  }

  return Array.from(bySession.values())
    .map((s) => ({
      sessionId: s.sessionId,
      turnCount: s.turnCount,
      avgConfidence: s._confCount > 0 ? s._confSum / s._confCount : null,
      avgSeverity: s._sevCount > 0 ? s._sevSum / s._sevCount : null,
      worstSeverity: s.worstSeverity,
      firstUserPreview: s.firstUserPreview,
      latestResponsePreview: s.latestResponsePreview,
      newestAt: s.newestAt,
      anyEscalation: s.anyEscalation,
    }))
    .sort((a, b) => (b.newestAt ?? '').localeCompare(a.newestAt ?? ''))
}

export function useSessionAggregates(payload: unknown): SessionSummary[] {
  return useMemo(() => aggregateSessions(normalizeTurns(payload)), [payload])
}
