import { httpClient } from '@shared/api/http-client'
import type { Example } from '@modules/example/logic/models/example'

/** Calls GET /api/examples — forwarded to the backend by the Vite proxy. */
export function fetchExamples(): Promise<Example[]> {
  return httpClient.get<Example[]>('/examples')
}
