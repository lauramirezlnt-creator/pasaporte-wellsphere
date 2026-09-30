import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="wsp-screen wsp-texture">
      <section className="wsp-cover" style={{ margin: "0 -20px" }}>
        <BrandMark variant="white" />
        <p className="wsp-cover-eyebrow wsp-mt-24">Pasaporte digital</p>
        <h1 className="wsp-cover-title">Código no encontrado</h1>
      </section>
      <section className="wsp-mt-32">
        <div className="wsp-card wsp-center-block">
          <div className="wsp-status-icon error" aria-hidden="true">
            !
          </div>
          <h2>Este QR no corresponde a ninguna actividad</h2>
          <p className="wsp-muted">
            Verifica que escaneaste el código correcto o contacta al equipo People.
          </p>
          <Link href="/" className="wsp-btn wsp-btn-ghost wsp-mt-32">
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
