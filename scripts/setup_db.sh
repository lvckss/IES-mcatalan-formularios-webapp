#!/usr/bin/env bash
set -euo pipefail

# ============================================
#  Ajustes de ruta y entorno
# ============================================
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Cargar /server/.env si existe (DB_*, DATABASE_URL, ADMIN_*, etc.)
SERVER_ENV="$ROOT_DIR/server/.env"
if [[ -f "$SERVER_ENV" ]]; then
  echo "🔧 Cargando variables desde $SERVER_ENV"
  set -a
  # shellcheck disable=SC1090
  source "$SERVER_ENV"
  set +a
else
  echo "⚠️  No se encontró $SERVER_ENV, usando valores por defecto / entorno."
fi

# ============================================
#  Configuración de la base de datos
# ============================================
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mcatalan}"
DB_USER="${DB_USER:-mcatalan_app}"
DB_PASSWORD="${DB_PASSWORD:-cambia_esta_password}"

# Usuario superadmin de Postgres (para CREATE ROLE / CREATE DATABASE)
PG_SUPER_USER="${PG_SUPER_USER:-postgres}"
PG_SUPER_PASSWORD="${PG_SUPER_PASSWORD:-postgres}"

SCHEMA_FILE="$ROOT_DIR/bd/public_tables.txt"
DATA_DIR="$ROOT_DIR/data"

echo "============================================"
echo "  🚀 Setup de base de datos"
echo "============================================"
echo "  ROOT_DIR : $ROOT_DIR"
echo "  DB_HOST  : $DB_HOST"
echo "  DB_PORT  : $DB_PORT"
echo "  DB_NAME  : $DB_NAME"
echo "  DB_USER  : $DB_USER"
echo "============================================"

# Helper para ejecutar psql como superusuario
psql_super() {
  PGPASSWORD="$PG_SUPER_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$PG_SUPER_USER" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

# ============================================
# 1) Crear rol de aplicación si no existe
# ============================================
echo "➡️  Asegurando rol '$DB_USER'..."

psql_super -d postgres <<SQL
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
      RAISE NOTICE 'Creando rol ${DB_USER}';
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
   ELSE
      RAISE NOTICE 'Rol ${DB_USER} ya existe, no se crea de nuevo';
   END IF;
END
\$\$;
SQL

# ============================================
# 2) Crear base de datos si no existe
#    (OJO: aquí NO usamos DO $$, va fuera de transacción)
# ============================================
echo "➡️  Asegurando base de datos '$DB_NAME'..."

DB_EXISTS=$(psql_super -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")

if [[ -z "$DB_EXISTS" ]]; then
  echo "   → No existe, creando base de datos ${DB_NAME} con owner ${DB_USER}..."
  psql_super -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
else
  echo "   → La base de datos ${DB_NAME} ya existe, no se crea de nuevo."
fi

# ============================================
# 3) Aplicar esquema público de tu app
# ============================================
echo "➡️  Aplicando esquema desde: $SCHEMA_FILE"

if [[ -f "$SCHEMA_FILE" ]]; then
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -f "$SCHEMA_FILE"
else
  echo "   ⚠️  No se encontró el fichero $SCHEMA_FILE. Saltando creación de tablas públicas."
fi

# ============================================
# 4) Insertar datos iniciales (leyes, ciclos, módulos, directivos…)
# ============================================
echo "➡️  Insertando datos iniciales desde $DATA_DIR..."

if [[ -d "$DATA_DIR" ]]; then
  # Orden explícito según tus FKs
  SQL_FILES=(
    "insert_leyes.sql"
    "insert_ciclos.sql"
    "insert_modulos.sql"
    "insert_directivos.sql"
  )

  for file in "${SQL_FILES[@]}"; do
    path="$DATA_DIR/$file"
    if [[ -f "$path" ]]; then
      echo "   → Ejecutando $file"
      PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 \
        -f "$path"
    else
      echo "   ⚠️  Aviso: no se encontró $path, se omite."
    fi
  done
else
  echo "   ⚠️  No se encontró el directorio $DATA_DIR. Saltando datos iniciales."
fi

# ============================================
# 5) Migraciones de Better Auth
# ============================================
echo "➡️  Ejecutando migraciones de Better Auth..."

(
  cd "$ROOT_DIR/server"

  if [ -f ".env" ]; then
    echo "   ℹ️  Cargando server/.env para DATABASE_URL y BETTER_AUTH_SECRET..."
    set -a
    # shellcheck disable=SC1090
    source ".env"
    set +a
  fi

  if ! command -v npx >/dev/null 2>&1; then
    echo "   ❌ npx no está disponible. Instala Node.js/npm o ajusta este paso."
  else
    npx @better-auth/cli migrate
  fi
)

# ============================================
# 6) Crear usuario admin con Better Auth
# ============================================
echo "➡️  Creando usuario admin (si no existe)..."

(
  cd "$ROOT_DIR/server"

  if ! command -v bun >/dev/null 2>&1; then
    echo "   ❌ bun no está disponible. Instala Bun o ajusta este paso."
  else
    bun run ./scripts/create-admin.ts
  fi
)

echo "============================================"
echo " ✅ Setup de base de datos COMPLETADO"
echo "============================================"
echo "  DB_NAME = $DB_NAME"
echo "  DB_USER = $DB_USER"
echo "  Admin   = \$ADMIN_EMAIL (desde server/.env)"
echo "============================================"