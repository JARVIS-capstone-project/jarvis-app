import type { RouteObject } from 'react-router'
import { RequireAuth } from '@app/router/require-auth'
import { ChatPage } from '@modules/chat/ui/pages/chat-page'
import { DevDocumentPage } from '@modules/chat/ui/pages/dev-document-page'

// Protected — RequireAuth guards the entry; empty children fall back to
// <Outlet /> inside the guard, which renders the child index route below.
// No AppLayout wrapper: /new is full-bleed so the chat section owns the
// full viewport height (until the sidebar shell lands).
export const chatRoutes: RouteObject[] = [
  {
    path: '/new',
    element: <RequireAuth />,
    children: [{ index: true, element: <ChatPage /> }],
  },
  {
    path: '/dev/document',
    element: <RequireAuth />,
    children: [{ index: true, element: <DevDocumentPage /> }],
  },
]
