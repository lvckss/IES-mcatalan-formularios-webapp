# Gestor de alumnado para la compulsa de certificados externos | IES Miguel Catalán

Aplicación interna para gestionar alumnado de Formacciona adscrito al IES Miguel Catalán y emitir certificaciones académicas oficiales desde el centro público.

El proyecto cubre el circuito completo de trabajo: alta de alumnado, expedientes por curso escolar, matrículas por módulo, calificaciones, convocatorias ordinarias y extraordinarias, grupos, importación/exportación Excel y generación de certificados PDF.

> [!IMPORTANT]
> El IES es el centro con capacidad administrativa para emitir la certificación. Formacciona aparece en los certificados como centro privado adscrito.

## Qué resuelve

- Registro y edición de datos personales del alumnado.
- Control de identificador legal único: DNI, NIE o pasaporte.
- Expedientes por ciclo, año escolar, turno y convocatoria.
- Matrículas por módulo con control de aprobados para evitar duplicados.
- Introducción individual o masiva de notas por acta.
- Creación de convocatoria extraordinaria a partir de los módulos no superados.
- Baja y alta de un alumno en un ciclo.
- Grupos de alumnos para filtrado y exportación.
- Importación masiva desde Excel.
- Exportación de listados a Excel.
- Generación de certificados PDF:
  - Anexo IV: obtención del título.
  - Anexo V: traslado de expediente u otros efectos.
- Panel de configuración para leyes, ciclos, módulos, directivos, cuentas y logo del certificado.

> [!NOTE]
> La numeración de expediente que se muestra actualmente sale del `id_estudiante`. Si en el centro se decide usar otra numeración oficial, conviene modelarla como campo propio antes de cerrar el despliegue final.

## Stack

Backend:

- Bun
- Hono
- PostgreSQL
- Better Auth
- Zod
- XLSX

Frontend:

- React
- Vite
- TanStack Router
- TanStack Query
- TanStack Table / Virtual
- shadcn/ui + Radix
- Tailwind CSS
- React PDF
- XLSX

## Estructura

```txt
.
├── bd/
│   └── public_tables.txt          # Esquema público de la aplicación
├── data/
│   ├── insert_leyes.sql
│   ├── insert_ciclos.sql
│   ├── insert_modulos.sql
│   └── insert_directivos.sql
├── server/
│   ├── app.ts                     # Hono, rutas API, auth y frontend estático en prod
│   ├── index.ts                   # Bun.serve
│   ├── auth.ts                    # Better Auth
│   ├── db/db.ts                   # Cliente Postgres
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── services/
├── frontend/
│   ├── src/routes/                # Rutas TanStack Router
│   ├── src/components/            # Pantallas y componentes de UI
│   ├── src/pdf/                   # Plantillas PDF
│   └── vite.config.ts             # Proxy dev /api y /uploads
├── scripts/
│   └── setup_db.sh                # Bootstrap de BD + datos + Better Auth + admin
└── storage/uploads/
    └── logo-certificado.png       # Logo usado en los certificados
```

## Requisitos

- Bun
- PostgreSQL
- Node/npm, solo si se usa el paso de migraciones Better Auth con `npx`

> [!TIP]
> En desarrollo se levantan dos procesos: backend en `127.0.0.1:3000` y frontend Vite en `http://localhost:5173`.

## Variables de entorno

El backend necesita variables de base de datos y autenticación. En este repo se usa normalmente `server/.env`.

Ejemplo:

```env
DATABASE_URL=postgres://mcatalan_app:cambia_esta_password@127.0.0.1:5432/mcatalan

BETTER_AUTH_SECRET=cambia_esto_por_un_secreto_largo
BETTER_AUTH_URL=http://localhost:3000
APP_ORIGIN=http://localhost:5173

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=cambia_esto
ADMIN_NAME=Administrador

PORT=3000
BUN_ENV=development
```

Alternativa sin `DATABASE_URL`:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=mcatalan
DB_USER=mcatalan_app
DB_PASSWORD=cambia_esta_password
```

> [!WARNING]
> Asegúrate de que las variables están cargadas antes de arrancar el backend. Para evitar sorpresas con imports ESM, usa `--env-file=server/.env` o expórtalas en la shell.

## Instalación

Desde la raíz:

```bash
bun install
```

Frontend:

```bash
cd frontend
bun install
```

## Base de datos

El script de setup crea rol, base de datos, tablas, datos iniciales, migraciones de Better Auth y usuario admin.

```bash
./scripts/setup_db.sh
```

El script espera que `server/.env` tenga las variables necesarias. Para crear la base y el rol usa también:

```env
PG_SUPER_USER=postgres
PG_SUPER_PASSWORD=postgres
```

> [!CAUTION]
> `bd/public_tables.txt` crea tablas y tipos. No lo ejecutes a ciegas sobre una base con datos si no sabes exactamente en qué estado está el esquema.

## Desarrollo

Backend:

```bash
bun --env-file=server/.env run dev
```

Frontend:

```bash
cd frontend
bun run dev
```

Abrir:

```txt
http://localhost:5173
```

Vite proxy:

```txt
/api      -> http://127.0.0.1:3000
/uploads  -> http://localhost:3000
```

Healthcheck:

```bash
curl http://127.0.0.1:3000/health
```

## Producción

Build del frontend:

```bash
cd frontend
bun run build
```

Arranque del backend:

```bash
cd ..
BUN_ENV=production bun --env-file=server/.env run start
```

En producción, Hono sirve `frontend/dist` y también los ficheros de `storage/uploads`.

> [!NOTE]
> Si se despliega detrás de Apache o un reverse proxy, el servidor Bun ya escucha en `127.0.0.1`. Ajusta `APP_ORIGIN` y `BETTER_AUTH_URL` al dominio público real.

## Rutas de la aplicación

- `/login`: inicio de sesión.
- `/estudiantes`: listado, filtros, grupos, importación, exportación y alta.
- `/introducir-acta`: introducción masiva de calificaciones por acta.
- `/configurar`: administración de catálogos, directivos, logo y cuentas.

## API principal

Todas las rutas de negocio cuelgan de `/api` y requieren sesión, salvo Better Auth.

- `/api/auth/*`: autenticación Better Auth.
- `/api/students`: alumnado, importación, filtros y datos completos.
- `/api/records`: expedientes, baja/alta, fecha de pago y borrado en cascada.
- `/api/enrollments`: matrículas, notas, extraordinarias y cálculo de mejores notas.
- `/api/cycles`: ciclos.
- `/api/modules`: módulos.
- `/api/laws`: leyes educativas.
- `/api/directivos`: director y secretario.
- `/api/groups`: grupos de alumnado.
- `/api/identidades`: cuentas, solo admin.
- `/api/settings/logo-certificado`: subida del logo del certificado.

## Reglas de negocio importantes

- Un estudiante no puede repetir `id_legal`.
- Un expediente se identifica por alumno, ciclo, curso escolar y convocatoria.
- Una matrícula pertenece siempre al mismo alumno que su expediente.
- Solo puede existir un aprobado por alumno y módulo.
- Al borrar una matrícula en cascada se borran intentos posteriores del mismo módulo.
- Al borrar un expediente en cascada se borran cursos posteriores del mismo alumno y ciclo.
- La extraordinaria se genera con los módulos no aprobados de la ordinaria.
- Los ciclos se agrupan por `codigo`, pero cada curso tiene su propia fila en `Ciclos`.
- `dado_baja` se aplica a los expedientes del mismo alumno y código de ciclo.

## Notas de calificación

El tipo `nota_enum` acepta:

```txt
0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10-MH, 10-Matr. Honor
CV, CV-5, CV-6, CV-7, CV-8, CV-9, CV-10, CV-10-MH
TRAS-5, TRAS-6, TRAS-7, TRAS-8, TRAS-9, TRAS-10, TRAS-10-MH
RC, NE, APTO, NO APTO, EX
```

En los certificados, las notas `TRAS-*` se muestran como nota con asterisco.

## Importación Excel

La importación masiva admite variaciones de cabecera. Columnas esperadas:

```txt
TIPO DE DOCUMENTO
DOCUMENTO
NOMBRE
APE1
APE2
SEXO
TELÉFONO
FECHA NACIMIENTO
LEY
CÓDIGO CICLO
AÑO ESCOLAR
TURNO
```

El servicio valida documento, fecha, año escolar, ley, ciclo y módulos de primero. Las filas rechazadas se devuelven en un informe de texto.

## PDFs

Los PDFs se generan en el navegador con `@react-pdf/renderer`.

Plantillas:

- `frontend/src/pdf/certificadoObtencionTituloDocument.tsx`
- `frontend/src/pdf/certificadoTrasladoDocument.tsx`

Logo:

```txt
storage/uploads/logo-certificado.png
```

El logo se puede cambiar desde `/configurar`.

## Scripts útiles

Raíz:

```bash
bun run dev
bun run start
```

Frontend:

```bash
bun run dev
bun run build
bun run lint
bun run preview
```

Base de datos:

```bash
./scripts/setup_db.sh
```

Crear admin manualmente:

```bash
cd server
bun --env-file=.env run ./scripts/create-admin.ts
```

## Estado del proyecto

El flujo principal está implementado. Quedan puntos que conviene tratar con cuidado antes de cerrar una versión estable:

- No hay suite de tests en el repo.
- Las reglas de notas aprobadas aparecen repetidas en backend, frontend y PDF.
- La numeración oficial de expediente está pendiente de criterio definitivo si no debe ser `id_estudiante`.
- Conviene revisar permisos finos si más adelante hay perfiles distintos de admin/usuario.
