import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import {
  mcpConnectionsService,
  type CatalogEntry,
  type Connection,
} from '@modules/connectors/api/mcp-connections-service'
import { BackHeader } from '@modules/connectors/ui/components/back-header'
import { Button } from '@shared/ui/button'
import { HttpApiError } from '@shared/api/http-client'

/**
 * Sign in to a catalog provider — create the connection, then hand the user to the
 * provider's consent screen and wait for the platform to finish the exchange.
 *
 * **The result arrives by polling, not from the popup.** The redirect lands on the
 * platform's callback, and since the popup is a different origin we cannot read it, so
 * the connection's own `status` is the only signal. That also means a blocked popup, a
 * manually opened tab, and a user finishing on their phone all work the same way.
 *
 * No credential passes through here. The platform holds the OAuth app per provider, so
 * the request that starts all this is just `{name, catalog_id}`.
 *
 * **The connection is created before consent, so this view owns rolling it back.** A row
 * that never reached `connected` holds no tokens and is invisible to the agent, but it
 * still shows up in the user's list looking like something they set up. Abandoning or
 * failing sign-in deletes it; only "Try again" keeps it, because that is the one path
 * still intending to use it.
 */
interface Props {
  entry: CatalogEntry
  onBack: () => void
  onConnected: (conn: Connection) => void
}

const POLL_MS = 2_000
const POLL_LIMIT = 60 // ~2 minutes, comfortably past a slow login

type Phase =
  | { name: 'creating' }
  | { name: 'awaiting'; conn: Connection; authorizeUrl: string; popupBlocked: boolean }
  | { name: 'timeout'; conn: Connection }
  | { name: 'error'; message: string }

export function OAuthConnectView({ entry, onBack, onConnected }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'creating' })
  // Guards React StrictMode's double-effect in dev, which would otherwise create two
  // connections for one click.
  const startedRef = useRef(false)

  /**
   * Drop a connection that never completed. Deliberately silent: this runs while the user
   * is leaving, and a toast about cleanup they did not ask for would read as an error. If
   * it fails the row simply stays — recoverable, and visible in the list.
   */
  const discard = useCallback(async (conn: Connection) => {
    await mcpConnectionsService.remove(conn.id).catch(() => undefined)
  }, [])

  const openConsent = useCallback((url: string) => {
    const popup = window.open(url, 'jarvis-oauth', 'width=600,height=760')
    return popup !== null
  }, [])

  const beginAuthorize = useCallback(
    async (conn: Connection) => {
      const { authorize_url } = await mcpConnectionsService.oauthAuthorize(conn.id)
      setPhase({
        name: 'awaiting',
        conn,
        authorizeUrl: authorize_url,
        popupBlocked: !openConsent(authorize_url),
      })
    },
    [openConsent],
  )

  // Step 1 — create the connection, then immediately ask for a consent URL.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void (async () => {
      let created: Connection | null = null
      try {
        created = await mcpConnectionsService.add({ name: entry.name, catalog_id: entry.id })
        await beginAuthorize(created)
      } catch (err) {
        // The row exists only if `add` was the call that succeeded; rolling it back here
        // is what keeps a failed authorize from leaving a connection nobody asked for.
        if (created) await discard(created)
        const detail = err instanceof HttpApiError ? err.detail : null
        setPhase({ name: 'error', message: detail ?? `Could not start sign-in for ${entry.name}` })
      }
    })()
  }, [entry.id, entry.name, beginAuthorize, discard])

  // Step 2 — watch the connection until the platform stores the tokens.
  useEffect(() => {
    if (phase.name !== 'awaiting') return
    const { conn } = phase
    let ticks = 0
    let stopped = false

    const timer = window.setInterval(() => {
      if (stopped) return
      ticks += 1
      if (ticks > POLL_LIMIT) {
        window.clearInterval(timer)
        setPhase({ name: 'timeout', conn })
        return
      }
      void mcpConnectionsService
        .get(conn.id)
        .then((fresh) => {
          if (stopped || fresh.status !== 'connected') return
          stopped = true
          window.clearInterval(timer)
          onConnected(fresh)
        })
        // A failed poll is almost always transient (the user is mid-redirect). Keep
        // ticking; the attempt limit is what ends this, not one bad response.
        .catch(() => undefined)
    }, POLL_MS)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [phase, onConnected])

  /** Leaving before the tokens land — the row would be dead weight, so drop it. */
  const abandon = async () => {
    if (phase.name === 'awaiting' || phase.name === 'timeout') await discard(phase.conn)
    onBack()
  }

  const retry = async () => {
    if (phase.name !== 'timeout') return
    try {
      // A fresh `state` — the one in the previous URL expires after ten minutes.
      await beginAuthorize(phase.conn)
    } catch {
      setPhase({ name: 'error', message: 'Could not reopen the sign-in window' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BackHeader onBack={() => void abandon()}>Connect {entry.name}</BackHeader>

      {phase.name === 'creating' && <p className="text-xs text-muted">Preparing sign-in…</p>}

      {phase.name === 'awaiting' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            Waiting for you to sign in to {entry.name} and approve access. This page updates
            on its own — you can close the {entry.name} window once it shows a result.
          </p>
          {phase.popupBlocked && (
            <p className="rounded-md border border-warning/40 bg-warning-soft px-2.5 py-2 text-xs text-warning">
              Your browser blocked the popup. Open the sign-in page manually:
            </p>
          )}
          <Button
            size="sm"
            variant={phase.popupBlocked ? 'primary' : 'ghost'}
            leftIcon={<ExternalLink className="size-3.5" />}
            onClick={() => openConsent(phase.authorizeUrl)}
          >
            Open {entry.name} sign-in
          </Button>
        </div>
      )}

      {phase.name === 'timeout' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            Sign-in did not finish. Try again to reopen the {entry.name} window, or cancel to
            remove this connection.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={retry}>
              Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void abandon()}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {phase.name === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="rounded-md border border-danger/40 bg-danger-soft px-2.5 py-2 text-xs text-danger">
            {phase.message}
          </p>
          <Button size="sm" variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        <span>
          You sign in with your own {entry.name} account. Access tokens are held encrypted by
          the platform and never reach this browser.
        </span>
      </p>
    </div>
  )
}
