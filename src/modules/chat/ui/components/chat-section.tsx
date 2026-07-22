import { PanelLeftOpen } from 'lucide-react'
import { useParams } from 'react-router'
import { ChatInput } from '@modules/chat/ui/components/chat-input'
import { ChatMessages } from '@modules/chat/ui/components/chat-messages'
import { MessageSkeleton } from '@modules/chat/ui/components/message-skeleton'
import { WelcomeHero } from '@modules/chat/ui/components/welcome-hero'
import {
  PRE_SESSION_KEY,
  useChatSession,
} from '@modules/chat/model/chat-session-store'

/**
 * Container for the right-hand chat pane. Three visual states keyed off the
 * per-session store slice + route param:
 *
 *   1. Welcome  — no sessionId (route is `/new`) AND no messages yet.
 *                 Hero + centered composer.
 *   2. Loading  — sessionId in URL, `hydrating: true`. Skeleton bubbles at
 *                 the top, composer already docked at the bottom so the
 *                 user can start typing while it loads (no layout jump when
 *                 real messages arrive).
 *   3. Loaded   — messages present. Real message list + composer at bottom.
 */
// Two soft brand-orange radial glows — a bigger one anchored to the top-right,
// a smaller accent to the bottom-left. Uses --brand-glow-* tokens so the
// effect adapts per theme (barely-there in light, prominent in dark) without
// extra JS. Painted on the panel bg via layered background-images.
const GLOW_LAYERS = `
  radial-gradient(ellipse 55% 45% at top right, var(--brand-glow-strong), transparent 70%),
  radial-gradient(ellipse 35% 30% at bottom left, var(--brand-glow-soft), transparent 70%)
`

interface ChatSectionProps {
  /** When provided (i.e. sidebar is closed), a top-left button renders that
   *  invokes this callback. Omit when the sidebar is already open. */
  onExpandSidebar?: () => void
}

export function ChatSection({ onExpandSidebar }: ChatSectionProps = {}) {
  const { sessionId } = useParams<{ sessionId?: string }>()
  // Fall back to PRE_SESSION_KEY on /new so the pre-session seed (user +
  // Thinking bubble that useChatSend appends the moment Send is pressed)
  // is visible BEFORE /sessions returns — that's the whole point of early-
  // seeding. Once /sessions succeeds, useChatSend migrates PRE_SESSION_KEY
  // to the real sid and navigates, so this fallback stops being read.
  const { messages, hydrating, streaming } = useChatSession(
    sessionId ?? PRE_SESSION_KEY,
  )

  // Welcome only on /new AND when no messages exist. Session URLs never
  // show the welcome hero — either they're hydrating (skeleton) or loaded.
  // The moment the user hits Send on /new, the pre-session seed populates
  // `messages`, so the welcome hero swaps out for the message list.
  const showWelcome = !sessionId && messages.length === 0

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-panel"
      style={{ backgroundImage: GLOW_LAYERS }}
    >
      {onExpandSidebar && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onExpandSidebar}
            aria-label="Open sidebar"
            className="flex size-9 items-center justify-center rounded-lg border border-divider bg-surface text-body transition-colors hover:bg-hover hover:text-heading"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}
      {showWelcome ? (
        // Welcome: hero + composer centered as one group.
        <div className="flex flex-1 flex-col justify-center gap-6">
          <WelcomeHero />
          <ChatInput />
        </div>
      ) : (
        // Loading OR loaded: top area fills, composer pinned to bottom.
        // Skeleton renders when hydrating AND we don't yet have messages —
        // once a message array lands (even mid-hydrate, from a race), the
        // real ChatMessages takes over so we never double-render.
        <>
          {hydrating && messages.length === 0 ? (
            <MessageSkeleton />
          ) : (
            <ChatMessages messages={messages} streaming={streaming} />
          )}
          <ChatInput />
        </>
      )}
    </div>
  )
}
