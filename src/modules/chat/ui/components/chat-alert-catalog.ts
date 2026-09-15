import type { ComponentType } from 'react'
import { AlertTriangle, FileWarning, FileX, LifeBuoy, ShieldAlert } from 'lucide-react'
import type { ChatAlertCode } from '@modules/chat/model/chat-session-store'

/**
 * Presentational spec for every typed chat alert. Add a row here when a new
 * `code` gets wired on the BE — the alert component switches on `code` so
 * only this file changes visually.
 *
 * `tone` selects the color palette (warning-* tokens vs danger-* tokens).
 * `title` + `description` render inside the full banner; `short` is the
 * collapsed-pill label. Keep `short` under ~48 chars so the pill stays on
 * one line at the standard composer width.
 */
export interface ChatAlertSpec {
  tone: 'warning' | 'danger'
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  short: string
  /**
   * Dismissing fully clears this alert instead of collapsing it to the
   * short pill.
   *
   * The pill is for a condition that is still true after the user reads it
   * (the upstream throttle), where ambient awareness is worth the space. A
   * verdict on one upload is finished the moment it has been read, so a
   * lingering pill just reads as a second warning about the same file.
   */
  clearsOnDismiss?: boolean
  /**
   * Render this alert on `/new`, before a session exists.
   *
   * Off by default: a fresh conversation reads clean, and a condition like
   * the upstream rate limit re-surfaces on the next turn inside a session
   * anyway, so hiding it costs the user nothing.
   *
   * The upload verdicts are the exception. They are raised while the send
   * is still pre-session — the pipeline throws during the upload step, so
   * `POST /sessions` never runs and there is no session view for the alert
   * to re-appear in later. Gated off, they are raised into a surface that
   * is guaranteed to be invisible, and the first message a user ever sends
   * fails in silence.
   */
  showsWithoutSession?: boolean
}

export const CHAT_ALERT_CATALOG: Record<ChatAlertCode, ChatAlertSpec> = {
  upstream_rate_limited: {
    tone: 'warning',
    Icon: AlertTriangle,
    title: 'AI service temporarily unavailable',
    description:
      'The daily AI quota has been reached. Please try again in a few hours — the limit resets automatically.',
    short: 'AI quota reached — try again in a few hours',
  },
  // Wire-ready for the human-escalation flag on `turn_end`. Not fired
  // by use-chat-send yet — kept here so the pattern is visible for the
  // follow-up ticket.
  requires_escalation: {
    tone: 'warning',
    Icon: LifeBuoy,
    title: 'Human specialist recommended',
    description:
      'This incident may need a human on-call. Consider escalating through your usual support channel.',
    short: 'Human specialist recommended for this incident',
    // Each turn re-fires this if it still applies, so a lingering pill
    // would be noise. (Previously special-cased by code in chat-alert.tsx.)
    clearsOnDismiss: true,
  },
  // The file was refused before it reached storage, so there is nothing to
  // clean up. The copy says the file was not stored because "rejected"
  // alone leaves people wondering whether a hostile file is now sitting in
  // their knowledge base. It then names the way out, because Send is held
  // down for as long as the blocked file is in the composer (see
  // `hasBlocked` in chat-input) — without that line the disabled button
  // reads as broken rather than as waiting on the user.
  malware_detected: {
    tone: 'danger',
    Icon: ShieldAlert,
    title: 'Malware detected in the uploaded file',
    description:
      'An attached file matched a known malware signature. It was not stored, and your message was not sent. Remove it from the message to continue.',
    short: 'Attachment blocked by malware scanning',
    showsWithoutSession: true,
    clearsOnDismiss: true,
  },
  // Fires at pick time, BEFORE the file leaves the browser — matches the
  // BE cap (`kb.max-upload-size-mb`, default 25) so the user does not spend
  // bandwidth on an upload that is guaranteed to 413. Purely a UX pre-check;
  // the BE remains the authoritative gate.
  file_too_large: {
    tone: 'danger',
    Icon: FileWarning,
    title: 'File is too large to upload',
    description:
      'One or more files exceed the 25 MB limit. They were not attached — pick a smaller file to continue.',
    short: 'File over the 25 MB limit — not attached',
    showsWithoutSession: true,
    clearsOnDismiss: true,
  },
  // Fires at pick time when the extension is not on the FE allowlist. The
  // allowlist mirrors what the agent's private-KB extractor can actually
  // read (see `private_kb/content.py`): PDF, Word, common text/log formats,
  // and inline-previewable images. Anything else uploads fine on the BE
  // (it accepts any type) but produces no useful text for the RAG turn,
  // so we reject up-front to save the round-trip.
  file_type_not_supported: {
    tone: 'danger',
    Icon: FileX,
    title: 'File type not supported',
    description:
      'One or more files were not attached. Supported types: PDF, Word (.docx), text/log/CSV/JSON/Markdown, and PNG/JPEG/GIF/WebP images.',
    short: 'Unsupported file type — not attached',
    showsWithoutSession: true,
    clearsOnDismiss: true,
  },
}
