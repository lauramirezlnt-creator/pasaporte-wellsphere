-- =========================================================
-- Pasaporte WellSphere — Esquema Supabase (Postgres)
-- Next Stop: WellSphere Wellness
-- =========================================================
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- Ver README.md sección "Configurar Supabase" para el paso a paso.
--
-- IMPORTANTE (auth por usuario/contraseña): si tu proyecto de Supabase
-- ya existía con la versión anterior (correo @epam.com + Auth Hook), corre
-- también esto una sola vez para eliminar el hook que ya no aplica:
--
--   drop function if exists public.enforce_epam_email_domain(jsonb);
--
-- Y en el Dashboard: Authentication > Hooks > "Before User Created" →
-- quita la selección de esa función si estaba configurada.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Tabla de asistencia (1 fila = 1 sello otorgado)
-- ---------------------------------------------------------

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stamp_id text not null,
  event_date date not null,
  created_at timestamptz not null default now(),

  constraint attendance_stamp_id_check check (
    stamp_id in ('thoughts', 'emotions', 'body', 'connections', 'values_fair')
  ),

  constraint attendance_user_stamp_unique unique (user_id, stamp_id)
);

comment on table public.attendance is
  'Un sello del pasaporte digital por usuario. UNIQUE(user_id, stamp_id) impide duplicados.';

create index if not exists attendance_user_id_idx on public.attendance (user_id);

-- ---------------------------------------------------------
-- 2. Row Level Security (RLS)
-- ---------------------------------------------------------

alter table public.attendance enable row level security;

-- Lectura: cada usuario solo ve sus propias filas.
drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own"
  on public.attendance
  for select
  using (auth.uid() = user_id);

-- Inserción: cada usuario solo puede insertar filas propias.
-- (En la práctica, los inserts de negocio pasan por la función
-- register_stamp() con SECURITY DEFINER, pero esta policy queda como
-- segunda capa de defensa si alguna vez se hace un insert directo.)
drop policy if exists "attendance_insert_own" on public.attendance;
create policy "attendance_insert_own"
  on public.attendance
  for insert
  with check (auth.uid() = user_id);

-- No se define policy de UPDATE ni DELETE: por diseño, nadie puede
-- modificar ni borrar un sello ya otorgado desde el cliente.

-- ---------------------------------------------------------
-- 3. Catálogo de sellos (referencia server-side)
-- ---------------------------------------------------------
-- Debe coincidir EXACTAMENTE con lib/stamps.ts (STAMPS) en el frontend.
-- Se usa dentro de register_stamp() para resolver event_date y validar
-- la ventana horaria por fecha real del sello (no la fecha del servidor).

create or replace function public.get_stamp_catalog()
returns table (stamp_id text, event_date date)
language sql
immutable
as $$
  select * from (values
    ('thoughts',     date '2026-10-07'),
    ('emotions',     date '2026-10-14'),
    ('body',         date '2026-10-21'),
    ('connections',  date '2026-10-28'),
    ('values_fair',  date '2026-11-04')
  ) as t(stamp_id, event_date)
$$;

-- ---------------------------------------------------------
-- 4. Función register_stamp — check-in server-side
-- ---------------------------------------------------------
-- Ejecuta TODA la validación de negocio en el servidor:
--   1. El usuario debe estar autenticado (auth.uid() no nulo).
--   2. stamp_id debe existir en el catálogo permitido.
--   3. La hora actual, en zona America/Bogota, debe estar entre
--      08:00 y 12:00 del event_date correspondiente a ese stamp_id.
--   4. No debe existir ya un registro (user_id, stamp_id).
--
-- Devuelve un texto de resultado que el frontend traduce a mensaje:
--   'success' | 'already_registered' | 'outside_window' | 'invalid_stamp'
--
-- SECURITY DEFINER: corre con permisos del owner (no del usuario final),
-- por eso hace sus propias validaciones explícitas en vez de depender
-- solo de RLS.

create or replace function public.register_stamp(p_stamp_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_date date;
  v_now_bogota timestamp;
  v_window_start timestamp;
  v_window_end timestamp;
begin
  -- 1. Debe existir sesión.
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- 2. stamp_id permitido + fecha correspondiente.
  select event_date into v_event_date
  from public.get_stamp_catalog()
  where stamp_id = p_stamp_id;

  if v_event_date is null then
    return 'invalid_stamp';
  end if;

  -- 3. Ventana horaria en hora Bogotá (COT, UTC-5 fijo, sin horario de
  --    verano). Se calcula convirtiendo "now()" (UTC) a America/Bogota,
  --    nunca se confía en la hora del dispositivo del usuario.
  v_now_bogota := now() at time zone 'America/Bogota';
  v_window_start := v_event_date + time '08:00';
  v_window_end := v_event_date + time '12:00';

  if v_now_bogota < v_window_start or v_now_bogota > v_window_end then
    return 'outside_window';
  end if;

  -- 4. Insertar si no existe ya (idempotente ante doble clic / doble scan).
  begin
    insert into public.attendance (user_id, stamp_id, event_date)
    values (v_user_id, p_stamp_id, v_event_date);
  exception
    when unique_violation then
      return 'already_registered';
  end;

  return 'success';
end;
$$;

-- Permitir ejecución solo a usuarios autenticados.
revoke all on function public.register_stamp(text) from public;
grant execute on function public.register_stamp(text) to authenticated;

-- ---------------------------------------------------------
-- 5. Autenticación por usuario + contraseña (sin correo real)
-- ---------------------------------------------------------
-- La app usa Supabase Auth con signUp()/signInWithPassword() de la forma
-- estándar. Como Supabase Auth solo modela identidad por email, cada
-- "usuario" se registra internamente como <username>@pasaporte.local
-- (ver lib/auth-username.ts en el frontend). Ese dominio nunca recibe
-- correos reales, así que:
--
--   1. En el Dashboard: Authentication > Providers > Email >
--      "Confirm email" debe estar DESACTIVADO. De lo contrario Supabase
--      exige confirmar por correo una dirección que nunca podrá recibir
--      el mensaje, bloqueando a todos los usuarios nuevos.
--   2. No se requiere ningún Auth Hook de dominio: cualquier persona
--      puede crear su cuenta con el usuario y contraseña que eligió.
--
-- El username real elegido por la persona se guarda además en
-- raw_user_meta_data.username (vía options.data en signUp()) para
-- trazabilidad, aunque el frontend lo deriva directamente del email
-- sintético (ver syntheticEmailToUsername()).

-- ---------------------------------------------------------
-- 6. (Opcional) Vista de solo lectura para People — SIN exponer a RLS pública
-- ---------------------------------------------------------
-- Por defecto NO se crea ningún panel administrativo (fuera de alcance:
-- "cero operación manual"). Si People necesita una auditoría puntual,
-- puede ejecutar esta consulta directamente desde el SQL Editor de
-- Supabase (requiere rol de servicio, nunca se expone al frontend):
--
-- select a.stamp_id, a.event_date, a.created_at, u.email
-- from public.attendance a
-- join auth.users u on u.id = a.user_id
-- order by a.event_date, a.created_at;
