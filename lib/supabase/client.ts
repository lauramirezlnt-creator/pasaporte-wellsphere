"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en Client Components ("use client").
 * Usa la anon key pública; toda la seguridad real vive en las políticas RLS
 * de Postgres, no en este cliente.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
