# Operación — Pasaporte WellSphere

Documento corto para el equipo **People** (uso diario) y el equipo **IT**
(monitoreo técnico) durante la campaña "Next Stop: WellSphere Wellness".

---

## 1. Qué hace People (idealmente nada)

El sistema fue diseñado para que **People no tenga que operar nada durante
la campaña**. No hay panel de administración, no hay que aprobar registros,
no hay que consolidar Excel ni exportar nada manualmente.

Las únicas tareas de People son **antes** de que empiece la campaña:

- [ ] Confirmar que las 5 fechas y textos en `lib/stamps.ts` /
      `supabase/schema.sql` son correctos.
- [ ] Confirmar el dominio de correo permitido (`epam.com`).
- [ ] Validar que la URL final de producción está correctamente configurada
      en Supabase (Site URL + Redirect URLs) y en las variables de entorno.
- [ ] Imprimir/proyectar las 5 piezas QR (ver README, sección 8) y
      coordinar con facilitadores/logística la exhibición de cada QR
      dentro de su ventana horaria (8:00 a.m.–12:00 p.m. COT).

Durante la campaña, People solo interviene si IT reporta una incidencia
puntual (ver sección 3).

Si en algún momento se necesita una auditoría o conteo (ej. cuántas
personas llevan los 5 sellos), un miembro de IT puede correr la consulta
SQL de solo lectura incluida al final de `supabase/schema.sql` desde el
SQL Editor de Supabase. No requiere ninguna acción de People.

---

## 2. Qué monitorea IT

### 2.1 Límites del free tier (Supabase)

| Recurso | Límite plan Free (referencial) | Qué monitorear |
|---|---|---|
| Filas de base de datos | 500 MB de almacenamiento | La tabla `attendance` es muy liviana (5 filas máx. por usuario); no debería acercarse al límite salvo con decenas de miles de empleados |
| Usuarios de Auth (MAU) | 50,000 usuarios activos/mes | Revisar si la organización tiene más empleados que el límite del plan |
| Envíos de correo (Auth emails) | Límite de envíos por hora/día del proveedor de email integrado de Supabase | **Este es el límite más sensible.** Si muchas personas intentan ingresar al mismo tiempo (ej. inicio de la Feria a las 8:00 a.m.), puede saturarse el envío de OTP/magic link |
| Requests a la API / Edge Functions | Cuota mensual del plan | La app es liviana (SSR + RPC), no debería acercarse al límite en un evento de este tamaño |

**Recomendación:** si se espera concurrencia alta (ej. 100+ personas
escaneando el QR de la Feria en el mismo minuto), evaluar con anticipación
si conviene:
- Configurar un proveedor SMTP propio en Supabase (Authentication >
  Email Templates > SMTP Settings) en vez del proveedor por defecto, para
  levantar el límite de envíos.
- O anticipar a los empleados que el correo puede tardar 1-2 minutos en
  llegar durante picos de uso.

### 2.2 Límites del free tier (Vercel/Netlify)

- Ancho de banda y minutos de build del plan gratuito — la app es muy
  liviana (páginas server-rendered simples, sin imágenes pesadas), el
  tráfico esperado de una campaña interna no debería acercarse al límite.
- Revisar el dashboard de Vercel/Netlify durante la semana de lanzamiento
  por si hay picos inesperados.

### 2.3 Logs a revisar

- **Supabase > Logs > Auth logs:** para ver intentos de login fallidos o
  bloqueados (ej. correos fuera de `@epam.com` rechazados por el Auth
  Hook, si está configurado).
- **Supabase > Logs > Postgres logs:** para ver errores en la función
  `register_stamp` (poco frecuentes; la función está diseñada para no
  lanzar excepciones no controladas salvo por falta de sesión o dominio
  inválido).
- **Vercel/Netlify > Deployments > Logs:** para errores de build o
  runtime del lado del frontend.

### 2.4 Seguridad

- Revisar periódicamente que **RLS sigue activo** en la tabla `attendance`
  (Supabase > Table Editor > ícono de escudo). Nadie del equipo debería
  desactivarlo nunca, ni siquiera temporalmente para "debug".
- Revisar que la `anon key` pública no cambió (si se regenera por error,
  hay que actualizar las variables de entorno en Vercel/Netlify).

---

## 3. Qué hacer si alguien no recibe el OTP / magic link

Flujo de resolución sugerido, de más simple a más profundo:

1. **Pedir que revise spam/no deseados** y que confirme que escribió
   correctamente su correo `@epam.com` (sin espacios, dominio correcto).
2. **Pedir que reintente** después de 1-2 minutos — los proveedores de
   email transaccional pueden tener latencia bajo picos de uso.
3. **Confirmar que no se excedió el límite de envíos de OTP** del plan
   Free de Supabase (ver sección 2.1). Si es así, ese es el problema real
   y no algo específico de la persona — hay que esperar a que se libere
   la ventana de rate-limit o migrar a SMTP propio.
4. **Pedir que use el mismo dispositivo/navegador** donde solicitó el
   enlace (el flujo de magic link de Supabase no depende de cookies
   cruzadas entre dispositivos, pero es la validación más simple primero).
5. Si el problema persiste para una persona puntual y la ventana horaria
   del sello ya cerró, **no hay reapertura automática** (regla de negocio
   fija). Cualquier excepción requiere que alguien de IT con acceso a
   Supabase inserte manualmente una fila en `attendance` desde el SQL
   Editor, documentando el motivo. Esto debe ser la excepción, no la
   norma.

### Plantilla de insert manual (solo IT, casos excepcionales)

```sql
insert into public.attendance (user_id, stamp_id, event_date)
values (
  (select id from auth.users where email = 'nombre.apellido@epam.com'),
  'thoughts',
  '2026-10-07'
)
on conflict (user_id, stamp_id) do nothing;
```

> Reemplaza el correo, el `stamp_id` y la fecha según el caso. El
> `on conflict ... do nothing` evita duplicar el sello si la persona sí
> logró registrarse por otro medio mientras tanto.
