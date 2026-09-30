import Link from "next/link";

export type CheckinOutcome =
  | { status: "success" }
  | { status: "already_registered" }
  | { status: "outside_window" }
  | { status: "invalid_stamp" }
  | { status: "unknown_error" };

interface CheckinResultProps {
  outcome: CheckinOutcome;
  stampLabel: string;
  displayDate: string;
}

export function CheckinResult({ outcome, stampLabel, displayDate }: CheckinResultProps) {
  if (outcome.status === "success") {
    return (
      <div className="wsp-center-block">
        <div className="wsp-status-icon success" aria-hidden="true">
          ✓
        </div>
        <h2>Sello registrado</h2>
        <p className="wsp-muted">
          Sumaste el sello <strong>{stampLabel}</strong> a tu pasaporte.
        </p>
        <Link href="/passport" className="wsp-btn wsp-btn-primary wsp-mt-32">
          Ver mi pasaporte
        </Link>
      </div>
    );
  }

  if (outcome.status === "already_registered") {
    return (
      <div className="wsp-center-block">
        <div className="wsp-status-icon info" aria-hidden="true">
          i
        </div>
        <h2>Ya registraste este sello</h2>
        <p className="wsp-muted">
          Tu sello de <strong>{stampLabel}</strong> ya estaba en tu pasaporte. No es posible
          registrarlo dos veces.
        </p>
        <Link href="/passport" className="wsp-btn wsp-btn-primary wsp-mt-32">
          Ver mi pasaporte
        </Link>
      </div>
    );
  }

  if (outcome.status === "outside_window") {
    return (
      <div className="wsp-center-block">
        <div className="wsp-status-icon error" aria-hidden="true">
          !
        </div>
        <h2>Aún no está disponible / ya cerró</h2>
        <p className="wsp-muted">
          El sello <strong>{stampLabel}</strong> solo se puede registrar el {displayDate}, entre
          8:00 a.m. y 12:00 p.m. (hora Bogotá).
        </p>
        <Link href="/passport" className="wsp-btn wsp-btn-ghost wsp-mt-32">
          Ver mi pasaporte
        </Link>
      </div>
    );
  }

  if (outcome.status === "invalid_stamp") {
    return (
      <div className="wsp-center-block">
        <div className="wsp-status-icon error" aria-hidden="true">
          !
        </div>
        <h2>Código no válido</h2>
        <p className="wsp-muted">
          Este código QR no corresponde a ninguna actividad del pasaporte. Contacta al equipo
          People si el problema persiste.
        </p>
      </div>
    );
  }

  return (
    <div className="wsp-center-block">
      <div className="wsp-status-icon error" aria-hidden="true">
        !
      </div>
      <h2>No pudimos registrar tu sello</h2>
      <p className="wsp-muted">Ocurrió un error inesperado. Intenta escanear el QR de nuevo.</p>
      <Link href="/passport" className="wsp-btn wsp-btn-ghost wsp-mt-32">
        Ver mi pasaporte
      </Link>
    </div>
  );
}
