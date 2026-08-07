import { httpClient } from '@shared/api/http-client'

// Shape of `GET /api/workspace/profile` — the workspace-scoped slice of the
// caller's identity. Kept separate from `Me` (auth-owned) because the fields
// belong to different services on the BE and evolve independently.
export interface WorkspaceProfile {
  jobRole: string
}

export const workspaceService = {
  getProfile(): Promise<WorkspaceProfile> {
    return httpClient.get<WorkspaceProfile>('/workspace/profile')
  },
}
