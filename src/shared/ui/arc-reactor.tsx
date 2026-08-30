import { lazy, Suspense } from 'react'

/**
 * Split out of the main bundle. `reactor-model` pulls in three.js plus the
 * react-three-fiber/drei stack — around 900 kB, and it is the single largest
 * thing the app ships. It renders on the landing hero and nowhere else, so a
 * static import made every user who signed in and went straight to the chat
 * download a 3D engine they would never see.
 *
 * Splitting here rather than at `ArcReactor` keeps the promise in the
 * docstring below: the HUD rings are plain SVG and still render on the page's
 * own mount, with only the mesh in the middle arriving late.
 */
const ReactorModel = lazy(() =>
  import('@shared/ui/reactor-model').then((m) => ({ default: m.ReactorModel })),
)

/**
 * Concentric HUD rings + the 3D reactor mesh at the center.
 *
 * Each ring sits at its own translateZ so the parent's perspective gives them
 * real depth: outer ~160px back, middle ~80px, inner ~40px.
 *
 * The rings are visible immediately — they belong to the page's mount sequence,
 * not the model's. The mesh in the middle has its own materialize animation
 * (see reactor-model.tsx) that runs when it finishes loading.
 *
 * Layout: full-bleed by default. Wrap in a positioned container to constrain.
 */
export function ArcReactor() {
  return (
    <div
      aria-hidden="true"
      style={{ transformStyle: 'preserve-3d' }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {/* Deepest layer — outer ring, pushed far back + faded for atmospheric depth. */}
      <div style={{ transform: 'translateZ(-160px)' }} className="absolute">
        <svg
          viewBox="0 0 400 400"
          className="hud-spin-rev size-[min(90vw,720px)] text-brand opacity-25 drop-shadow-[0_0_18px_var(--brand-glow-strong)]"
        >
          <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
          {Array.from({ length: 60 }, (_, i) => {
            const angle = (i * 360) / 60
            const long = i % 5 === 0
            return (
              <line
                key={i}
                x1="200"
                y1={long ? 8 : 12}
                x2="200"
                y2={long ? 20 : 16}
                stroke="currentColor"
                strokeWidth={long ? 1 : 0.5}
                transform={`rotate(${angle} 200 200)`}
              />
            )
          })}
        </svg>
      </div>

      {/* Middle layer — dashed radar sweep, mid-depth. */}
      <div style={{ transform: 'translateZ(-80px)' }} className="absolute">
        <svg
          viewBox="0 0 400 400"
          className="hud-spin size-[min(70vw,560px)] text-brand opacity-40 drop-shadow-[0_0_14px_var(--brand-glow-strong)]"
        >
          <circle
            cx="200"
            cy="200"
            r="196"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="40 20 8 20"
          />
          <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Near layer — inner ring, closest to the card. Cardinal markers give
          the eye a rotation reference. */}
      <div style={{ transform: 'translateZ(-40px)' }} className="absolute">
        <svg
          viewBox="0 0 400 400"
          className="hud-spin-slow size-[min(50vw,400px)] text-brand opacity-55 drop-shadow-[0_0_12px_var(--brand-glow-strong)]"
        >
          <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 4"
          />
          {[0, 90, 180, 270].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 200 200)`}>
              <line x1="200" y1="0" x2="200" y2="14" stroke="currentColor" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      </div>

      {/* Volumetric bloom behind the mesh — a soft radial glow that keeps the
          orange spill even when the model textures load dark. Pure CSS, cheap. */}
      <div
        style={{ transform: 'translateZ(-260px)' }}
        className="hud-pulse absolute size-[min(36vw,300px)] rounded-full"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, var(--brand-glow-strong) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
      </div>

      {/* The real 3D reactor — a spinning glTF mesh at the center of the rings.
          Container is oversized on purpose so the model's rotation swing has
          room without getting clipped by the canvas rectangle. Model itself
          is sized by MODEL_SCALE in reactor-model.tsx, not this container. */}
      <div
        style={{ transform: 'translateZ(-140px)' }}
        className="absolute size-[min(70vw,600px)]"
      >
        {/* No fallback: the mesh already fades itself in once the glTF loads
            (see reactor-model.tsx), and the rings around this slot carry the
            composition on their own until it does. A spinner here would
            announce a wait the design does not otherwise have. */}
        <Suspense fallback={null}>
          <ReactorModel />
        </Suspense>
      </div>
    </div>
  )
}
