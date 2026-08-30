import { create } from 'zustand'

/**
 * Transient-notification queue. Hand-rolled rather than pulled from a library
 * because the app needs one shape — a line of text that fades after a few
 * seconds — and a toast library brings a positioning engine, a queue policy,
 * and a swipe layer none of it would use.
 *
 * Split from the rendering component so the imperative `toast.*` helpers can
 * be imported by stores and event handlers without dragging a React component
 * along (and without tripping fast-refresh's one-export-kind rule).
 */

export type ToastVariant = 'success' | 'danger'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

/** Long enough to read a sentence, short enough not to sit in the way. */
export const TOAST_MS = 4000

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, variant = 'success') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, variant }],
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Imperative entry point — callable from stores and event handlers, not just
 *  components, which is where most outcomes worth reporting actually happen. */
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show(message, 'success'),
  danger: (message: string) => useToastStore.getState().show(message, 'danger'),
}
