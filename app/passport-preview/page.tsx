import Link from "next/link";
import { PassportView } from "@/components/PassportView";
import "../passport/passport.css";

/**
 * Vista previa SOLO PARA DESARROLLO/DISEÑO — sin login, sin Supabase,
 * con datos de ejemplo (2 de 5 sellos). Sirve para revisar el diseño del
 * pasaporte antes de tener un proyecto Supabase configurado.
 *
 * No forma parte del flujo real de negocio: eliminar esta ruta antes de
 * ir a producción (o dejarla, ya que no expone datos reales de ningún
 * usuario — solo un ejemplo estático).
 */
export default function PassportPreviewPage() {
  return (
    <>
      <div
        style={{
          background: "#241C33",
          color: "#fff",
          fontSize: 12,
          textAlign: "center",
          padding: "6px 12px"
        }}
      >
        Vista previa de diseño (datos de ejemplo, sin login) ·{" "}
        <Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          Ir al inicio real
        </Link>
      </div>
      <PassportView
        username="tu.usuario"
        sealedStampIds={["thoughts", "emotions"]}
        hideLogout
      />
    </>
  );
}
