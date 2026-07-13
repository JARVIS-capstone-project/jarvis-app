import type { RouteObject } from 'react-router'
import { RequireAuth } from '@app/router/require-auth'
import { NewChatPage } from '@modules/chat/ui/pages/new-chat-page'

// Protected — RequireAuth guards the entry; empty children fall back to
// <Outlet /> inside the guard, which renders the child index route below.
// (No AppLayout wrapper: /new renders bare while the real chat UI is built.)
export const chatRoutes: RouteObject[] = [
  {
    path: '/new',
    element: <RequireAuth />,
    children: [{ index: true, element: <NewChatPage /> }],
  },
]
