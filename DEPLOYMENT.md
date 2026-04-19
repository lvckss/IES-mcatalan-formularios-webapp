# Despliegue en Produccion

Este documento describe como funciona el despliegue de la aplicacion en el servidor de produccion.

## Arquitectura

La aplicacion se despliega como una app Bun/Hono detras de Apache.

Flujo de peticiones:

```txt
Navegador
  -> Apache2
  -> Bun/Hono en 127.0.0.1:3000
  -> PostgreSQL
```

El backend Hono sirve:

- La API en `/api/*`.
- Better Auth en `/api/auth/*`.
- Los ficheros subidos en `/uploads/*`, desde `storage`.
- El frontend compilado desde `frontend/dist`.

Por eso Apache no necesita ejecutar React ni Vite. En produccion solo actua como frontal HTTP/HTTPS y redirige el trafico al proceso Bun.

## Datos del Servidor

Valores usados actualmente en produccion:

```bash
APP=/srv/ies-mcatalan-formularios-webapp/app
DEPLOY_USER=deploy
BUN=/home/deploy/.bun/bin/bun
SERVICE=ies-mcatalan.service
BACKEND=http://127.0.0.1:3000
```

El repositorio debe pertenecer al usuario `deploy`. Aunque se entre por SSH como `root`, los comandos de Git y Bun se ejecutan como `deploy` para evitar problemas de permisos.

## Variables de Entorno

El backend lee la configuracion desde `server/.env`.

En produccion debe contener, como minimo:

```env
BUN_ENV=production
PORT=3000

DATABASE_URL=postgres://usuario:password@127.0.0.1:5432/nombre_bd

BETTER_AUTH_SECRET=secreto_largo
BETTER_AUTH_URL=https://dominio-publico
APP_ORIGIN=https://dominio-publico
```

Si no se usa `DATABASE_URL`, el backend puede conectar con variables separadas:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=mcatalan
DB_USER=mcatalan_app
DB_PASSWORD=password
```

No subas `.env` al repositorio.

## Despliegue Normal

Entrar por SSH al servidor y trabajar como `root`:

```bash
ssh root@SERVIDOR
```

Definir variables para la sesion:

```bash
APP=/srv/ies-mcatalan-formularios-webapp/app
DEPLOY_USER=deploy
BUN=/home/deploy/.bun/bin/bun
SERVICE=ies-mcatalan.service
```

Comprobar estado del repo:

```bash
sudo -u $DEPLOY_USER git -C $APP status --short
sudo -u $DEPLOY_USER git -C $APP log -1 --oneline
```

Actualizar al ultimo commit:

```bash
sudo -u $DEPLOY_USER git -C $APP pull --ff-only
```

Instalar dependencias del backend:

```bash
sudo -u $DEPLOY_USER bash -lc "cd $APP && $BUN install --frozen-lockfile"
```

Instalar dependencias del frontend:

```bash
sudo -u $DEPLOY_USER bash -lc "cd $APP/frontend && $BUN install --frozen-lockfile"
```

Compilar el frontend:

```bash
sudo -u $DEPLOY_USER bash -lc "cd $APP/frontend && $BUN run build"
```

Comprobar que existe el build:

```bash
ls -lah $APP/frontend/dist
```

Reiniciar el backend:

```bash
systemctl restart $SERVICE
systemctl status $SERVICE --no-pager
```

Validar y recargar Apache:

```bash
apachectl configtest
systemctl reload apache2
systemctl status apache2 --no-pager
```

Comprobar que el backend responde:

```bash
curl -i http://127.0.0.1:3000/health
```

Comprobar que Apache responde:

```bash
curl -I http://localhost
```

El despliegue esta correcto cuando:

- `bun run build` termina sin error.
- `systemctl status ies-mcatalan.service` muestra `active (running)`.
- `apachectl configtest` muestra `Syntax OK`.
- `/health` responde `200`.

## Comando Completo

Este bloque resume el despliegue habitual:

```bash
APP=/srv/ies-mcatalan-formularios-webapp/app
DEPLOY_USER=deploy
BUN=/home/deploy/.bun/bin/bun
SERVICE=ies-mcatalan.service

sudo -u $DEPLOY_USER git -C $APP status --short
sudo -u $DEPLOY_USER git -C $APP pull --ff-only

sudo -u $DEPLOY_USER bash -lc "cd $APP && $BUN install --frozen-lockfile"
sudo -u $DEPLOY_USER bash -lc "cd $APP/frontend && $BUN install --frozen-lockfile"
sudo -u $DEPLOY_USER bash -lc "cd $APP/frontend && $BUN run build"

systemctl restart $SERVICE
systemctl status $SERVICE --no-pager

apachectl configtest
systemctl reload apache2

curl -i http://127.0.0.1:3000/health
curl -I http://localhost
```

## Servicio Systemd

El backend se gestiona con systemd:

```bash
systemctl status ies-mcatalan.service --no-pager
systemctl restart ies-mcatalan.service
journalctl -u ies-mcatalan.service -n 100 --no-pager
```

El servicio debe arrancar Bun desde la raiz del proyecto y cargar `server/.env`.

Ejemplo orientativo de unidad systemd:

```ini
[Unit]
Description=IES Mcatalan WebApp Bun Backend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/ies-mcatalan-formularios-webapp/app
Environment=BUN_ENV=production
ExecStart=/home/deploy/.bun/bin/bun --env-file=server/.env run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Si se cambia el fichero de servicio:

```bash
systemctl daemon-reload
systemctl restart ies-mcatalan.service
```

## Apache

Apache debe publicar el dominio y enviar el trafico al backend Bun en `127.0.0.1:3000`.

Ejemplo orientativo de VirtualHost:

```apache
<VirtualHost *:80>
    ServerName dominio-publico

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog ${APACHE_LOG_DIR}/ies-mcatalan-error.log
    CustomLog ${APACHE_LOG_DIR}/ies-mcatalan-access.log combined
</VirtualHost>
```

Modulos habituales:

```bash
a2enmod proxy
a2enmod proxy_http
a2enmod headers
systemctl reload apache2
```

Si hay HTTPS con Certbot, el VirtualHost real puede estar en `:443` y tener certificados configurados. En ese caso no sobrescribas el fichero a ciegas; valida primero:

```bash
apachectl configtest
apachectl -S
```

## Problemas Comunes

### Git: dubious ownership

Si se ejecuta `git pull` como `root` dentro de un repo que pertenece a `deploy`, Git puede mostrar:

```txt
fatal: detected dubious ownership in repository
```

La solucion recomendada es ejecutar Git como `deploy`:

```bash
sudo -u deploy git -C /srv/ies-mcatalan-formularios-webapp/app pull --ff-only
```

Alternativa, solo si se quiere permitir ese repo para `root`:

```bash
git config --global --add safe.directory /srv/ies-mcatalan-formularios-webapp/app
```

### Pull bloqueado por lockfiles

Si `git pull` falla por cambios locales en:

```txt
bun.lockb
frontend/bun.lockb
```

normalmente son cambios generados por instalaciones en el servidor. Si no hay cambios manuales que conservar, restaurarlos:

```bash
sudo -u deploy git -C /srv/ies-mcatalan-formularios-webapp/app restore bun.lockb frontend/bun.lockb
sudo -u deploy git -C /srv/ies-mcatalan-formularios-webapp/app pull --ff-only
```

Antes de restaurar, se puede revisar:

```bash
sudo -u deploy git -C /srv/ies-mcatalan-formularios-webapp/app status --short
```

### `sudo: bun: command not found`

Puede pasar porque `sudo` no carga el `PATH` del usuario `deploy`.

Usar la ruta absoluta:

```bash
sudo -u deploy bash -lc "cd /srv/ies-mcatalan-formularios-webapp/app && /home/deploy/.bun/bin/bun install --frozen-lockfile"
```

O comprobar donde esta Bun:

```bash
sudo -iu deploy bash -lc 'command -v bun && bun --version'
ls -la /home/deploy/.bun/bin/bun
```

### Error de sintaxis con `&&`

Si se usa `bash -lc '...'`, evita cortar la cadena justo antes de `&&`.

Correcto:

```bash
sudo -u deploy bash -lc "cd $APP/frontend && $BUN install --frozen-lockfile && $BUN run build"
```

Tambien se puede ejecutar en dos comandos separados:

```bash
sudo -u deploy bash -lc "cd $APP/frontend && $BUN install --frozen-lockfile"
sudo -u deploy bash -lc "cd $APP/frontend && $BUN run build"
```

### Bun bloquea un postinstall

Bun puede mostrar:

```txt
Blocked 1 postinstall. Run `bun pm untrusted` for details.
```

Si el build termina correctamente, no hay que hacer nada. Si una dependencia falla porque necesita su postinstall, revisar:

```bash
sudo -u deploy bash -lc "cd /srv/ies-mcatalan-formularios-webapp/app/frontend && /home/deploy/.bun/bin/bun pm untrusted"
```

### El backend no arranca

Revisar logs:

```bash
journalctl -u ies-mcatalan.service -n 150 --no-pager
```

Comprobar variables:

```bash
ls -lah /srv/ies-mcatalan-formularios-webapp/app/server/.env
```

Comprobar puerto:

```bash
ss -ltnp | grep 3000
```

### Apache no responde bien

Validar configuracion:

```bash
apachectl configtest
apachectl -S
```

Revisar logs:

```bash
journalctl -u apache2 -n 100 --no-pager
tail -n 100 /var/log/apache2/error.log
```

## Base de Datos

El despliegue normal no recrea la base de datos.

El script:

```bash
./scripts/setup_db.sh
```

esta pensado para preparar una base desde cero o aplicar el esquema y datos iniciales. No debe ejecutarse en produccion sin revisar antes que no vaya a pisar datos o duplicar inserts.

Las migraciones de Better Auth tambien se ejecutan desde ese script, pero en produccion conviene tratarlas como paso controlado.

## Verificacion Funcional

Despues del despliegue:

1. Abrir la web publica.
2. Iniciar sesion.
3. Entrar en `/estudiantes`.
4. Comprobar que carga la tabla.
5. Entrar en `/introducir-acta`.
6. Comprobar que se cargan leyes, ciclos, cursos y alumnos.
7. Generar o abrir un PDF si el despliegue tocaba certificados.
8. Comprobar que `/uploads/logo-certificado.png` carga correctamente si se tocaron ficheros estaticos o Apache.

## Notas de Seguridad

- No ejecutar `git pull` como `root` salvo que se haya decidido expresamente.
- No editar `bun.lockb` en produccion.
- No subir `.env` al repositorio.
- No reiniciar Apache antes de validar con `apachectl configtest`.
- No ejecutar scripts de base de datos en produccion sin copia de seguridad y revision previa.
