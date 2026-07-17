import { useEffect, useRef } from 'react'
import { MessageBubble } from '@modules/chat/ui/components/message-bubble'
import type { ChatMessage } from '@modules/chat/model/types'

interface ChatMessagesProps {
  messages: ChatMessage[]
}

/**
 * Scrollable message list. Auto-scrolls to the newest message whenever the
 * count changes. Takes all available flex space so the composer below stays
 * pinned to the bottom of the chat section.
 */
export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Instant scroll is fine for local-echo; switch to { behavior: 'smooth' }
    // once streaming lands to soften the jump on partial-token updates.
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
