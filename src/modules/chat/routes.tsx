import type { RouteObject } from 'react-router'
import { RequireAuth } from '@app/router/require-auth'
import { RedirectIfRole } from '@app/router/redirect-if-role'
import { ChatPage } from '@modules/chat/ui/pages/chat-page'
import { DevDocumentPage } from '@modules/chat/ui/pages/dev-document-page'

// Protected — RequireAuth guards the entry; empty children fall back to
// <Outlet /> inside the guard, which renders the child index route below.
// No AppLayout wrapper: /new is full-bleed so the chat section owns the
// full viewport height (until the sidebar shell lands).
//
// Admins are bounced to `/admin/system` at these routes — user surface is
// off-limits per the admin-only-uses-admin-endpoints rule. BE stays
// permissive today; this is FE-side enforcement only.
//
// `/new`             — first-message composer, no session_id yet
// `/chat/:sessionId` — deep-linkable session URL. Same page; children
//                      read useParams to drive per-session state.
export const chatRoutes: RouteObject[] = [
  {
    path: '/new',
    element: (
      <RequireAuth>
        <RedirectIfRole role="ADMIN" to="/admin/system">
          <ChatPage />
        </RedirectIfRole>
      </RequireAuth>
    ),
  },
  {
    path: '/chat/:sessionId',
    element: (
      <RequireAuth>
        <RedirectIfRole role="ADMIN" to="/admin/system">
          <ChatPage />
        </RedirectIfRole>
      </RequireAuth>
    ),
  },
  {
    path: '/dev/document',
    element: <RequireAuth />,
    children: [{ index: true, element: <DevDocumentPage /> }],
  },
]
