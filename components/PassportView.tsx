import Link from "next/link";
import { STAMPS } from "@/lib/stamps";
import { BrandMark } from "@/components/BrandMark";

interface PassportViewProps {
  username: string;
  sealedStampIds: string[];
  /** Si es true, oculta el link "Cerrar sesión" (útil para vistas de preview). */
  hideLogout?: boolean;
}

/**
 * UI pura del pasaporte: cubierta + progreso + 5 sellos.
 * No hace fetch de datos ni auth — recibe todo por props.
 * Se usa tanto en /passport (datos reales de Supabase) como en
 * /passport-preview (datos de ejemplo, sin login, solo para revisar diseño).
 */
export function PassportView({ username, sealedStampIds, hideLogout }: PassportViewProps) {
  const sealedSet = new Set(sealedStampIds);
  const totalSealed = STAMPS.filter((s) => sealedSet.has(s.id)).length;
  const progressPct = Math.round((totalSealed / STAMPS.length) * 100);

  return (
    <main className="wsp-screen wsp-texture">
      <section className="wsp-cover" style={{ margin: "0 -20px" }}>
        <div className="wsp-passport-header">
          <BrandMark variant="white" />
          {!hideLogout && (
            <Link href="/logout" className="wsp-logout-link">
              Cerrar sesión
            </Link>
          )}
        </div>
        <p className="wsp-cover-eyebrow wsp-mt-24">Mi pasaporte</p>
        <h1 className="wsp-cover-title">Next Stop: WellSphere Wellness</h1>
        <p className="wsp-cover-subtitle">{username}</p>
      </section>

      <section className="wsp-stack wsp-mt-32">
        <div className="wsp-card">
          <div className="wsp-progress-wrap">
            <div className="wsp-progress-track">
              <div className="wsp-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="wsp-progress-count">
              {totalSealed}/{STAMPS.length}
            </span>
          </div>
          <p className="wsp-muted wsp-mt-24">
            {totalSealed === STAMPS.length
              ? "Pasaporte completo. ¡Gracias por recorrer los 5 destinos!"
              : "Escanea el QR de cada actividad, dentro del horario indicado, para sumar tu sello."}
          </p>
        </div>

        <div className="wsp-stack">
          {STAMPS.map((stamp) => {
            const isSealed = sealedSet.has(stamp.id);

            return (
              <div key={stamp.id} className={`wsp-stamp-page ${isSealed ? "" : "is-pending"}`}>
                <div
                  className={`wsp-stamp-mark ${isSealed ? "" : "is-pending"}`}
                  style={
                    isSealed
                      ? { background: `var(--wsp-gradient-${gradientKey(stamp.id)})` }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  {String(stamp.order).padStart(2, "0")}
                </div>
                <div className="wsp-stamp-info">
                  <span className="wsp-stamp-order">Destino {stamp.order} de 5</span>
                  <span className="wsp-stamp-label">{stamp.label}</span>
                  <span className="wsp-stamp-date">{stamp.displayDate}</span>
                  <span
                    className={`wsp-badge ${isSealed ? "wsp-badge-sealed" : "wsp-badge-pending"}`}
                    style={{ marginTop: 4, alignSelf: "flex-start" }}
                  >
                    {isSealed ? "Sellado" : "Pendiente"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function gradientKey(stampId: string): string {
  switch (stampId) {
    case "thoughts":
      return "thoughts";
    case "emotions":
      return "emotions";
    case "body":
      return "body";
    case "connections":
      return "connections";
    case "values_fair":
      return "values";
    default:
      return "thoughts";
  }
}
