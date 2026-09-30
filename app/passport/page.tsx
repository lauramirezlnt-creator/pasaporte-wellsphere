import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PassportView } from "@/components/PassportView";
import { syntheticEmailToUsername } from "@/lib/auth-username";
import "./passport.css";

export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/?next=/passport");
  }

  // RLS garantiza que esta consulta solo devuelva filas del propio usuario
  // (policy: user_id = auth.uid()), sin necesidad de filtrar por user_id aquí.
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("stamp_id, event_date, created_at");

  if (error) {
    return (
      <main className="wsp-screen wsp-texture">
        <section className="wsp-mt-32">
          <div className="wsp-card">
            <p className="wsp-error-text">
              No pudimos cargar tu pasaporte en este momento. Intenta de nuevo más tarde.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PassportView
      username={syntheticEmailToUsername(userData.user.email)}
      sealedStampIds={(attendance ?? []).map((row) => row.stamp_id)}
    />
  );
}
