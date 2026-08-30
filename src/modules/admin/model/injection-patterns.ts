/**
 * Display names for the scanner labels `injection_flags[].patterns` carries.
 *
 * The wire values are snake_case identifiers (`instruction_override`) — right
 * for an API, wrong for a dashboard someone reads at a glance.
 *
 * `PATTERN_HINTS` covers the seven labels in `validation/injection.py` today.
 * That table has grown before (`authority_impersonation` was added after the
 * first six), so nothing here may assume it is complete: an unknown label
 * still title-cases cleanly and simply has no hint. A pattern the FE has never
 * heard of must render, not disappear.
 */
const PATTERN_HINTS: Record<string, string> = {
  instruction_override: 'Ignore / disregard / forget + previous instructions',
  system_prompt_probe: 'Reveal / print / dump + the system prompt',
  role_hijack: '"You are now…" / "new system instructions:"',
  authority_impersonation: 'Claims to be admin or owner + demands access',
  tool_coercion: '"You must call / invoke" + a tool, function or MCP',
  exfiltration: 'Send / upload / leak + conversation, credentials or keys',
  delimiter_spoof: 'Fake chat markers — <|im_start|>, [INST], </system>',
}

/** `instruction_override` → `Instruction Override`. Works on any label. */
export function patternLabel(pattern: string): string {
  return pattern
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Tooltip text: what the label matches, plus the raw wire value — the pretty
 * name is for reading, the identifier is what you paste into `?pattern=` or
 * grep the backend for, so hiding it entirely would cost more than it saves.
 */
export function patternTooltip(pattern: string): string {
  const hint = PATTERN_HINTS[pattern]
  return hint ? `${pattern} — ${hint}` : pattern
}
