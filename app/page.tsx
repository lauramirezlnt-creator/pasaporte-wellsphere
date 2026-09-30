import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthUsernameForm } from "@/components/AuthUsernameForm";
import { BrandMark } from "@/components/BrandMark";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(data.user);

  return (
    <main className="wsp-screen wsp-texture">
      <section className="wsp-cover" style={{ margin: "0 -20px" }}>
        <BrandMark variant="white" />
        <p className="wsp-cover-eyebrow wsp-mt-24">Pasaporte digital de bienestar</p>
        <h1 className="wsp-cover-title">Next Stop: WellSphere Wellness</h1>
        <p className="wsp-cover-subtitle">
          Cinco destinos, cinco sellos. Un recorrido de bienestar solo para ti.
        </p>
      </section>

      <section className="wsp-stack wsp-mt-32">
        {isLoggedIn ? (
          <div className="wsp-card wsp-stack">
            <h2>Bienvenido de nuevo</h2>
            <p className="wsp-muted">
              Tu sesión está activa. Consulta tu progreso o cierra sesión si no eres tú.
            </p>
            <Link href="/passport" className="wsp-btn wsp-btn-primary">
              Ver mi pasaporte
            </Link>
            <Link href="/logout" className="wsp-btn wsp-btn-ghost">
              Cerrar sesión
            </Link>
          </div>
        ) : (
          <div className="wsp-card wsp-stack">
            <h2>Ingresa a tu pasaporte</h2>
            <p className="wsp-muted">
              Inicia sesión con tu usuario y contraseña, o crea una cuenta nueva si es tu primera
              vez.
            </p>
            <AuthUsernameForm redirectPath="/passport" />
          </div>
        )}

        <div className="wsp-card-flat">
          <h3>¿Cómo funciona?</h3>
          <div className="wsp-divider" />
          <ol className="wsp-stack" style={{ margin: 0, paddingLeft: 18 }}>
            <li className="wsp-muted">Escanea el código QR de cada actividad, entre 8:00 a.m. y 12:00 p.m. (hora Bogotá).</li>
            <li className="wsp-muted">Ingresa con tu usuario y contraseña. Si no tienes cuenta, créala en segundos.</li>
            <li className="wsp-muted">Tu sello queda registrado automáticamente. Nadie más puede verlo.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
