import { useState } from 'react'
import { Sidebar } from '@app/layout/sidebar'
import { ChatSection } from '@modules/chat/ui/components/chat-section'
import { cn } from '@shared/lib/cn'

/**
 * `/new` — chat page shell. Owns the sidebar open/closed flag because two
 * children need to react to it:
 *   - <Sidebar/> renders when open. Below md it's a fixed overlay drawer
 *     (see sidebar.tsx classes); at md+ it's a flex child that pushes chat.
 *   - <ChatSection/> receives `onExpandSidebar` when closed → shows the
 *     top-left expand button.
 *   - A backdrop scrim renders on mobile only, tap-to-close.
 *
 * Initial state is viewport-aware (open on md+, closed below) so mobile
 * users see the chat first; from that point on it's purely user-driven —
 * rotating a phone doesn't clobber the user's choice.
 */
export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )
  const close = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen w-full bg-canvas">
      {sidebarOpen && <Sidebar onClose={close} />}
      {/* Mobile-only backdrop. `md:hidden` keeps desktop layout untouched. */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={close}
          className="fixed inset-0 z-40 bg-scrim md:hidden"
        />
      )}
      <main
        className={cn(
          'min-w-0 flex-1 p-2 md:py-4 md:pr-4',
          // Desktop only — no gap between sidebar and section when open
          // (rounded corner supplies the visual break); symmetric when closed.
          // On mobile the sidebar is fixed/overlay, so main width never changes.
          sidebarOpen ? 'md:pl-0' : 'md:pl-4',
        )}
      >
        <ChatSection
          onExpandSidebar={sidebarOpen ? undefined : () => setSidebarOpen(true)}
        />
      </main>
    </div>
  )
}
