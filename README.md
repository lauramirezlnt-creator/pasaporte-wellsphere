# Pasaporte WellSphere — Next Stop: WellSphere Wellness

Pasaporte digital de bienestar, mobile-first, **sin Microsoft 365**. Cada
persona crea su propia cuenta con un usuario y contraseña, escanea un QR
por fecha y ve solo su propio progreso (5 sellos). Cero operación manual
recurrente para el equipo People.

- **Frontend:** Next.js 14 (App Router), mobile-first, sin librerías de UI
  externas (CSS propio con los tokens de marca WellSphere LATAM).
- **Auth:** Supabase Auth — usuario + contraseña. Como Supabase Auth solo
  modela identidad por email, cada username se mapea internamente a
  `<username>@pasaporte.local` (ver `lib/auth-username.ts`); ese dominio
  nunca recibe correos reales.
- **Backend/DB:** Supabase (Postgres + RLS). Toda la validación de negocio
  (ventana horaria, duplicados) corre **server-side** en una función SQL
  (`register_stamp`), nunca en el navegador.
- **Hosting:** Vercel (free tier) o Netlify (free tier).

---

## Índice

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Crear el proyecto en Supabase](#2-crear-el-proyecto-en-supabase)
3. [Configurar Auth (usuario + contraseña)](#3-configurar-auth-usuario--contraseña)
4. [Crear tablas, constraints y políticas RLS](#4-crear-tablas-constraints-y-políticas-rls)
5. [Configurar variables de entorno](#5-configurar-variables-de-entorno)
6. [Ejecutar en local](#6-ejecutar-en-local)
7. [Desplegar en Vercel](#7-desplegar-en-vercel)
8. [Generar los 5 códigos QR y piezas A4](#8-generar-los-5-códigos-qr-y-piezas-a4)
9. [Pruebas end-to-end con un correo @epam.com](#9-pruebas-end-to-end-con-un-correo-epamcom)
10. [Reglas de negocio implementadas](#10-reglas-de-negocio-implementadas)
11. [Seguridad y privacidad](#11-seguridad-y-privacidad)
12. [Riesgos conocidos / decisiones documentadas](#12-riesgos-conocidos--decisiones-documentadas)

---

## 1. Estructura del proyecto

```
pasaporte-wellsphere/
├── app/
│   ├── page.tsx                    # Landing "/": login/registro + botón "Ver mi pasaporte"
│   ├── layout.tsx                  # Layout raíz + fuentes (Poppins/Inter)
│   ├── checkin/[stamp_id]/page.tsx # Flujo de check-in (QR)
│   ├── passport/page.tsx           # Vista "Mi pasaporte" (5 sellos)
│   └── logout/page.tsx             # Cierra sesión
├── components/
│   ├── AuthUsernameForm.tsx        # Formulario con tabs "Iniciar sesión" / "Crear cuenta"
│   ├── CheckinResult.tsx           # Estados de resultado del check-in
│   └── BrandMark.tsx               # Logo WellSphere LATAM
├── lib/
│   ├── stamps.ts                   # Catálogo único de los 5 sellos (fuente de verdad frontend)
│   ├── auth-username.ts            # Validación de usuario/contraseña + mapeo a email sintético
│   └── supabase/
│       ├── client.ts                # Cliente Supabase para Client Components
│       └── server.ts                # Cliente Supabase para Server Components
├── middleware.ts                    # Refresca la sesión de Supabase en cada request
├── supabase/
│   └── schema.sql                   # Tablas + RLS + función register_stamp (TODO el SQL)
├── scripts/
│   ├── generarQR.mjs                # Genera los 5 QR (PNG + SVG)
│   └── generarA4.mjs                # Genera las 5 piezas imprimibles A4 (HTML → PDF)
├── public/
│   ├── brand/                       # Logo WellSphere LATAM (SVG, color y blanco)
│   └── qr/                          # QR y piezas A4 generados (no se versionan en git)
├── styles/globals.css               # Tokens de marca + estética "pasaporte"
└── .env.example
```

---

## 2. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis).
2. **New Project** → elige nombre (ej. `pasaporte-wellsphere`), contraseña
   de base de datos (guárdala) y región más cercana (ej. `South America`).
3. Espera a que el proyecto termine de aprovisionarse (1-2 minutos).
4. Ve a **Project Settings > API** y copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Configurar Auth (usuario + contraseña)

1. En el dashboard: **Authentication > Providers > Email**.
   - Actívalo si no está activo.
   - **Confirm email:** **DESACTIVADO**. Esto es obligatorio: cada usuario
     se registra internamente con un email sintético
     `<username>@pasaporte.local` (ver `lib/auth-username.ts`) que nunca
     puede recibir un correo real. Si dejas la confirmación activada,
     ninguna cuenta nueva podrá iniciar sesión.
   - "Enable password sign-up" debe estar activado (es el método usado).
2. **Authentication > URL Configuration**:
   - **Site URL:** la URL final de producción (ej.
     `https://pasaporte-wellsphere.vercel.app`). Ya no se usa para redirect
     de magic link, pero Supabase la sigue requiriendo como configuración
     general del proyecto.
3. No se requiere ningún Auth Hook: cualquier persona puede crear su
   cuenta con el usuario y contraseña que elija, sin restricción de
   dominio de correo.
4. (Opcional, recomendado) En **Authentication > Rate Limits**, revisa el
   límite de registros/inicios de sesión por hora para evitar abuso
   durante picos de check-in simultáneo (ej. inicio de la Feria).

## 4. Crear tablas, constraints y políticas RLS

1. Ve a **SQL Editor > New query**.
2. Copia y pega **todo** el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
3. Ejecuta (`Run`). Esto crea:
   - Tabla `attendance` con `UNIQUE(user_id, stamp_id)` y `CHECK` de
     `stamp_id` contra la lista permitida.
   - RLS activado + policies de `SELECT`/`INSERT` restringidas a
     `auth.uid() = user_id`.
   - Función `register_stamp(p_stamp_id text)` — hace toda la validación
     de negocio server-side (ver sección 10).
4. Verifica en **Table Editor** que la tabla `attendance` existe y que
   **RLS** aparece como "Enabled" (ícono de escudo verde).

> **Importante:** las fechas de cada sello están fijas dentro de la función
> `get_stamp_catalog()` en `schema.sql`. Si cambian las fechas del evento,
> hay que actualizar **ambos** lugares: `lib/stamps.ts` (frontend) y
> `get_stamp_catalog()` en Supabase (backend), y volver a ejecutar ese
> fragmento del SQL.

## 5. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_PUBLICA
NEXT_PUBLIC_APP_URL=https://pasaporte-wellsphere.vercel.app
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: de la
  sección 2. Son públicas por diseño (la seguridad real vive en RLS), pero
  igual no se deben commitear en `.env.local` (ya está en `.gitignore`).
- `NEXT_PUBLIC_APP_URL`: la URL final donde vive la app desplegada. Se usa
  para generar los QR.

## 6. Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Para probar el check-in localmente, visita
`http://localhost:3000/checkin/thoughts` (o cualquier otro `stamp_id`).

> La ventana horaria (8-12 COT) se valida con la hora real del servidor de
> Supabase, no con la del dispositivo. Si pruebas fuera de esa ventana,
> verás correctamente el mensaje "Aún no está disponible / ya cerró" — eso
> confirma que la validación server-side funciona.

## 7. Desplegar en Vercel

1. Sube este repositorio a GitHub (puede ser privado).
2. Ve a [vercel.com](https://vercel.com) → **Add New > Project** → importa
   el repositorio.
3. En **Environment Variables**, agrega las 3 variables de la sección 5
   (con los valores reales de producción).
4. Deploy. Vercel te da una URL (ej. `https://pasaporte-wellsphere.vercel.app`).
5. Vuelve a Supabase → **Authentication > URL Configuration** → actualiza
   **Site URL** y **Redirect URLs** con esa URL real si aún tenías un
   placeholder.
6. Actualiza `NEXT_PUBLIC_APP_URL` en Vercel con la URL definitiva y vuelve
   a desplegar (Vercel > Deployments > Redeploy) para que los QR que
   generes después apunten correctamente.

**Alternativa Netlify:** el proceso es equivalente (conectar repo, definir
las mismas 3 variables de entorno, framework preset "Next.js").

## 8. Generar los 5 códigos QR y piezas A4

Con `NEXT_PUBLIC_APP_URL` ya apuntando a la URL final de producción:

```bash
npm run qr        # genera public/qr/<stamp_id>.png y .svg
npm run qr:a4      # genera public/qr/a4/<stamp_id>.html (listo para imprimir)
```

Para obtener el PDF imprimible de cada pieza A4:
1. Abre `public/qr/a4/thoughts.html` (y los otros 4) en el navegador.
2. `Ctrl+P` → Destino: "Guardar como PDF" → Tamaño de papel: A4 → Márgenes:
   Ninguno → Guardar.

Cada pieza incluye: logo WellSphere LATAM, título del sello, fecha, la
instrucción "Escanea para registrar tu sello (solo 8:00 a.m. a 12:00 p.m.
COT)" y la nota "Solo correo @epam.com".

> Los 5 QR usan la **misma URL** sin importar sede o modalidad (virtual o
> presencial), tal como pide el negocio: un solo QR por fecha, global.

## 9. Pruebas end-to-end

1. Desde un celular, escanea (o abre manualmente) `https://TU-DOMINIO/checkin/thoughts`.
2. Crea una cuenta nueva (usuario + contraseña) → deberías quedar
   autenticado de inmediato (sin correo que confirmar).
3. Si estás dentro de la ventana 8-12 COT del 07 de octubre: deberías ver
   "Sello registrado" con botón "Ver mi pasaporte".
4. Ve a `/passport`: debe mostrar 1/5 sellos, con "Tus pensamientos" en
   estado "Sellado" y los otros 4 en "Pendiente".
5. Repite el check-in en la misma URL: debe mostrar "Ya registraste este
   sello" (no debe crear una segunda fila).
6. Prueba fuera de la ventana horaria (o cambia temporalmente la fecha en
   `get_stamp_catalog()` a una fecha pasada, solo en un proyecto de
   pruebas): debe mostrar "Aún no está disponible / ya cerró".
7. Cierra sesión (`/logout`) y vuelve a iniciar sesión con el mismo
   usuario y contraseña: debe mantener el progreso guardado.
8. Intenta crear una cuenta con un usuario ya existente: debe mostrar
   "Ese usuario ya existe".

---

## 10. Reglas de negocio implementadas

| Regla | Dónde se implementa |
|---|---|
| Ventana de check-in 08:00–12:00 hora Bogotá (COT) | `register_stamp()` en `supabase/schema.sql`, calculado con `now() at time zone 'America/Bogota'` (server-side, no depende del reloj del dispositivo) |
| Máximo 1 sello por persona por fecha | `UNIQUE(user_id, stamp_id)` en la tabla `attendance` + manejo explícito de `unique_violation` en `register_stamp()` |
| QR global por fecha (misma URL todas las sedes/virtual) | Una sola ruta `/checkin/[stamp_id]` por fecha; no hay variantes por sede |
| Identidad por usuario + contraseña (sin correo real) | Frontend: `lib/auth-username.ts` (validación + mapeo a email sintético `@pasaporte.local`). Backend: Supabase Auth estándar (`signUp`/`signInWithPassword`) |
| Cada usuario ve solo su propio progreso | RLS: policy `attendance_select_own` (`auth.uid() = user_id`). No existe endpoint ni UI de búsqueda por usuario |
| Validación de `stamp_id` contra lista permitida | `CHECK` constraint en la tabla + `get_stamp_catalog()` dentro de `register_stamp()` |

---

## 11. Seguridad y privacidad

- **RLS activado** en `attendance`, con policies mínimas: `SELECT` e
  `INSERT` solo del propio usuario. No hay policy de `UPDATE` ni `DELETE`
  — ningún sello se puede modificar ni borrar desde el cliente.
- **Sin búsqueda por usuario:** no existe ningún endpoint, vista ni policy
  que permita a un usuario consultar el pasaporte de otra persona.
- **Autenticación real vía Supabase Auth:** `signUp()` / `signInWithPassword()`
  estándar. Las contraseñas nunca se almacenan ni se ven en el frontend;
  Supabase las gestiona con hashing seguro.
- **Sin dato personal real requerido:** al no exigir un correo corporativo,
  la cuenta no queda ligada a la identidad real de la persona salvo que
  ella misma elija un username que la identifique.
- **Validación de ventana horaria 100% server-side:** el frontend nunca
  decide si un check-in es válido; solo llama a `register_stamp()` (RPC) y
  muestra el resultado que devuelve Postgres.

---

## 12. Riesgos conocidos / decisiones documentadas

- **"Confirm email" debe estar desactivado en Supabase:** es un requisito
  obligatorio de esta arquitectura (usuarios se registran con un email
  sintético `@pasaporte.local` que nunca puede confirmarse por correo). Si
  alguien vuelve a activar esa opción en el dashboard, todas las cuentas
  nuevas quedarán bloqueadas sin poder iniciar sesión.
- **Usuarios duplicados con distinta capitalización:** el username se
  normaliza a minúsculas antes de mapearlo al email sintético
  (`normalizeUsername()` en `lib/auth-username.ts`), por lo que "Ana" y
  "ana" son la misma cuenta.
- **Next.js en rama 14.2.x:** se usa `14.2.35` (última versión estable
  parcheada de la rama 14). `npm audit` reporta CVEs adicionales cuyo fix
  definitivo requiere migrar a Next.js 16 (aún con cambios de breaking
  cambios de API a la fecha de este documento). IT debe evaluar y
  planificar esa migración cuando la rama 16 tenga un release estable
  maduro; no se fuerza aquí para no introducir inestabilidad de última
  hora antes del lanzamiento del evento.
- **No hay panel administrativo:** por diseño ("cero operación manual"),
  no se construyó ninguna UI de administración. Cualquier auditoría
  puntual del equipo People se hace vía SQL Editor de Supabase (consulta
  de ejemplo al final de `supabase/schema.sql`), con rol de servicio, nunca
  expuesta al frontend.
- **Ventana horaria fija, sin reapertura:** si alguien no logra sellar
  dentro de la ventana, el sistema no ofrece ninguna excepción automática.
  Cualquier caso especial requeriría una operación manual directa en la
  base de datos (fuera del flujo normal de la app), decisión que debe
  tomar el equipo People caso por caso.
  deploy
