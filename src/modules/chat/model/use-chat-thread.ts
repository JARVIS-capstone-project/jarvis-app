import { useCallback } from 'react'
import { useChatStore } from '@modules/chat/model/chat-store'
import type { ChatAttachment, ChatMessage } from '@modules/chat/model/types'

interface UseChatThreadResult {
  messages: ChatMessage[]
  isEmpty: boolean
  /** Append a user message to the thread — may carry attachments. */
  send: (content: string, attachments?: ChatAttachment[]) => void
}

/**
 * View-model for a chat thread. Wraps the store selectors so the section
 * component consumes a domain-shaped API (`{ messages, isEmpty, send }`)
 * instead of touching store internals — mirrors the useLogin/login-form
 * pattern already in the auth module.
 */
export function useChatThread(): UseChatThreadResult {
  const messages = useChatStore((s) => s.messages)
  const append = useChatStore((s) => s.append)
  const send = useCallback(
    (content: string, attachments?: ChatAttachment[]) => append('user', content, attachments),
    [append],
  )

  return {
    messages,
    isEmpty: messages.length === 0,
    send,
  }
}
