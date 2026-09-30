import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStampById, isValidStampId } from "@/lib/stamps";
import { AuthUsernameForm } from "@/components/AuthUsernameForm";
import { BrandMark } from "@/components/BrandMark";
import { CheckinResult, type CheckinOutcome } from "@/components/CheckinResult";

export const dynamic = "force-dynamic";

interface CheckinPageProps {
  params: { stamp_id: string };
}

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { stamp_id } = params;

  if (!isValidStampId(stamp_id)) {
    notFound();
  }

  const stamp = getStampById(stamp_id)!;
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <main className="wsp-screen wsp-texture">
      <section className="wsp-cover" style={{ margin: "0 -20px" }}>
        <BrandMark variant="white" />
        <p className="wsp-cover-eyebrow wsp-mt-24">Registro de sello</p>
        <h1 className="wsp-cover-title">{stamp.label}</h1>
        <p className="wsp-cover-subtitle">
          {stamp.displayDate} · 8:00 a.m. a 12:00 p.m. (hora Bogotá)
        </p>
      </section>

      <section className="wsp-mt-32">
        {!userData.user ? (
          <div className="wsp-card wsp-stack">
            <h2>Ingresa con tu usuario</h2>
            <p className="wsp-muted">
              Para registrar tu sello necesitamos confirmar tu identidad. Inicia sesión o crea tu
              cuenta.
            </p>
            <AuthUsernameForm
              redirectPath={`/checkin/${stamp_id}`}
              helperText="Al iniciar sesión, tu sello se registrará automáticamente si estás dentro del horario permitido."
            />
          </div>
        ) : (
          <CheckinAttempt stampId={stamp_id} />
        )}
      </section>
    </main>
  );
}

async function CheckinAttempt({ stampId }: { stampId: string }) {
  const stamp = getStampById(stampId)!;
  const supabase = createSupabaseServerClient();

  // Toda la validación real (ventana horaria en COT, duplicados, stamp_id
  // permitido, dominio de correo) ocurre server-side dentro de la función
  // SQL `register_stamp` (ver supabase/schema.sql). El frontend nunca decide
  // si el check-in es válido.
  const { data, error } = await supabase.rpc("register_stamp", {
    p_stamp_id: stampId
  });

  let outcome: CheckinOutcome;

  if (error) {
    outcome = { status: "unknown_error" };
  } else {
    switch (data) {
      case "success":
        outcome = { status: "success" };
        break;
      case "already_registered":
        outcome = { status: "already_registered" };
        break;
      case "outside_window":
        outcome = { status: "outside_window" };
        break;
      case "invalid_stamp":
        outcome = { status: "invalid_stamp" };
        break;
      default:
        outcome = { status: "unknown_error" };
    }
  }

  return (
    <div className="wsp-card">
      <CheckinResult outcome={outcome} stampLabel={stamp.label} displayDate={stamp.displayDate} />
    </div>
  );
}
