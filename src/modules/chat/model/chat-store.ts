import { create } from 'zustand'
import type { ChatAttachment, ChatMessage, MessageRole } from '@modules/chat/model/types'

/**
 * Local-only chat state. No persistence, no server sync — messages live
 * for the lifetime of the tab. Backend wiring (POST /chat, SSE stream)
 * lands in a follow-up ticket; the append() shape below is what the
 * network layer will call once it exists.
 *
 * Attachments carry blob: URLs; clear() revokes them so the browser can
 * reclaim the underlying Blobs. Composer chips that never made it to a
 * message are revoked by the composer itself (see chat-input.tsx).
 */
interface ChatState {
  messages: ChatMessage[]
  append: (role: MessageRole, content: string, attachments?: ChatAttachment[]) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  append: (role, content, attachments) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role,
          content,
          createdAt: Date.now(),
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
        },
      ],
    })),
  clear: () =>
    set((s) => {
      s.messages.forEach((m) => m.attachments?.forEach((a) => URL.revokeObjectURL(a.previewUrl)))
      return { messages: [] }
    }),
}))
