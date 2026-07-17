import { PanelLeftOpen } from 'lucide-react'
import { ChatInput } from '@modules/chat/ui/components/chat-input'
import { ChatMessages } from '@modules/chat/ui/components/chat-messages'
import { WelcomeHero } from '@modules/chat/ui/components/welcome-hero'
import { useChatThread } from '@modules/chat/model/use-chat-thread'

/**
 * Container for the right-hand chat pane. Owns nothing itself — pulls the
 * thread from useChatStore and delegates to hero/messages/input.
 *
 * Rendering rule: when the thread is empty, the welcome hero fills the
 * space above the composer. As soon as the first message is appended,
 * the hero is unmounted and the scrollable message list takes over.
 *
 * The section is `h-full` so a parent layout (page/sidebar shell) controls
 * width — collapsing the sidebar simply gives this component more room,
 * no responsive logic needed here.
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
  const { messages, isEmpty, send } = useChatThread()

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
      {isEmpty ? (
        // Empty state: hero + composer are one centered group, so the
        // composer sits directly under the greeting instead of being
        // pinned to the bottom.
        <div className="flex flex-1 flex-col justify-center gap-6">
          <WelcomeHero />
          <ChatInput onSend={send} />
        </div>
      ) : (
        // Active thread: messages fill the top, composer pinned to bottom.
        <>
          <ChatMessages messages={messages} />
          <ChatInput onSend={send} />
        </>
      )}
    </div>
  )
}
