import { useEffect, useRef } from 'react'
import { MessageBubble } from '@modules/chat/ui/components/message-bubble'
import type { ChatMessage } from '@modules/chat/model/types'

interface ChatMessagesProps {
  messages: ChatMessage[]
  /** True while `/stream` is open. When set and the LAST message is an empty
   *  assistant bubble (no `text_delta` yet), that bubble shows "Thinking...".
   *  Once the first delta lands, `content` is non-empty → indicator hides. */
  streaming?: boolean
}

/**
 * Scrollable message list. Auto-scrolls to the newest message whenever the
 * count changes. Takes all available flex space so the composer below stays
 * pinned to the bottom of the chat section.
 */
export function ChatMessages({ messages, streaming = false }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Instant scroll is fine for local-echo; switch to { behavior: 'smooth' }
    // once streaming lands to soften the jump on partial-token updates.
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const lastIdx = messages.length - 1
  const last = messages[lastIdx]
  const showThinkingOnLast =
    streaming &&
    last?.role === 'assistant' &&
    last.content.length === 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            isThinking={showThinkingOnLast && i === lastIdx}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
