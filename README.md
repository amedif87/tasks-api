# Tasks API

API REST para gestionar tareas, hecha con **NestJS + TypeScript**, **TypeORM** y **SQLite** (con migraciones).

## Cómo ejecutarlo

Requisitos: **Node 24.x** y npm. La versión de referencia es **24.15.0** (`.nvmrc`);
`package.json` declara Node 24 y CI comprueba esa versión. Node 18 no está soportado por las dependencias actuales.

```bash
npm ci
npm run start:dev    # desarrollo con recarga   (o: npm run build && npm start)
npm test             # tests HTTP, migraciones, transformaciones y persistencia
npm run typecheck    # comprueba src y test con TypeScript
```

No hay pasos previos: **las migraciones se aplican solas al arrancar** y la base de datos
(`data/tasks.sqlite`) se crea si no existe. SQLite se instala con la dependencia `better-sqlite3`:
no hay que descargarlo ni configurar un servidor aparte. Los datos persisten entre reinicios.
El archivo de BD está excluido de Git; una descarga nueva empieza sin tareas y las seis tareas de ejemplo
creadas durante la revisión solo existen en la base local donde se probaron.

La API usa el puerto 3000 por defecto. No se implementó `GET /`: la entrada para explorarla es `/docs`.

**Documentación interactiva:** abre `http://localhost:3000/docs`. Swagger UI muestra los cinco endpoints,
los campos, ejemplos, filtros, paginación y códigos HTTP. Pulsa **Try it out**, completa la petición
y pulsa **Execute** para probar la API; las operaciones modifican la base de datos de esa instancia.
El contrato OpenAPI se publica en `http://localhost:3000/docs-json` y se puede importar en Postman.
Si cambias `PORT`, usa ese mismo puerto en ambas direcciones (por ejemplo, `http://localhost:3001/docs`).

Variables opcionales (ver `.env.example`): `PORT` (3000) y `DB_PATH` (`data/tasks.sqlite`).
La aplicación y el CLI leen las variables del proceso; **no cargan `.env` automáticamente**.
Ejemplo en PowerShell:

```powershell
$env:PORT = '3001'
$env:DB_PATH = 'data/custom.sqlite'
npm run start:dev
```

En Bash: `PORT=3001 DB_PATH=data/custom.sqlite npm run start:dev`.

Migraciones a mano (opcional):

```bash
npm run migration:run      # aplicar
npm run migration:revert   # deshacer la última
```

## Endpoints

| Método | Ruta         | Descripción                     | Éxito |
| ------ | ------------ | ------------------------------- | ----- |
| POST   | `/tasks`     | Crear tarea                     | 201   |
| GET    | `/tasks`     | Listar con filtros y paginación | 200   |
| GET    | `/tasks/:id` | Ver una tarea                   | 200   |
| PATCH  | `/tasks/:id` | Editar (parcial)                | 200   |
| DELETE | `/tasks/:id` | Borrar                          | 204   |

**Tarea:** `title` (obligatorio, ≤120), `description` (≤2000), `status` (`pending` por defecto, `in_progress`, `done`),
`assignee` (responsable, ≤100) y `dueDate` (se guarda y devuelve normalizada a UTC).
Descripción, responsable y fecha límite son opcionales; su ausencia se representa con `null`.
La fecha acepta `YYYY-MM-DD` (medianoche UTC) o fecha/hora con `T` y zona explícita, por ejemplo
`2026-12-01T10:00:00-03:00` o `2026-12-01T13:00:00.000Z`. La hora admite minutos, segundos opcionales
y hasta tres decimales en los segundos. Las horas sin zona y los formatos ISO semanales o compactos devuelven `400`.

**Listado:** `GET /tasks?status=pending&assignee=ana&page=1&limit=20`

- `status`: uno de los tres estados. `assignee`: coincidencia exacta usando `LOWER` de SQLite,
  sin distinguir mayúsculas ASCII; no se garantiza equivalencia para todos los caracteres Unicode.
- `page`: entero entre 1 y 1.000.000 (por defecto 1); `limit`: entero entre 1 y 100 (por defecto 20).
- Respuesta: `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`. Orden: más recientes primero.

**Códigos de error:** `400` validación (cuerpo, query o `:id` que no es UUID; también PATCH vacío o campos desconocidos),
`404` tarea inexistente. Formato Nest estándar: `{ "statusCode", "error", "message" }`.

```bash
curl -X POST localhost:3000/tasks -H 'content-type: application/json' \
  -d '{"title":"Preparar demo","assignee":"Ana","dueDate":"2026-12-01"}'

curl 'localhost:3000/tasks?status=pending&assignee=ana&limit=10'

curl -X PATCH localhost:3000/tasks/<id> -H 'content-type: application/json' \
  -d '{"status":"in_progress","assignee":null}'     # null vacía el campo
```

## Estructura

```
src/
  main.ts · app.module.ts · app.setup.ts   # arranque; setup (pipes) compartido con los tests
  database/
    data-source.ts                         # única configuración de BD (app + CLI de migraciones)
    migrations/                            # esquema inicial e índice de LOWER(assignee)
  tasks/
    task.entity.ts · task-status.enum.ts
    tasks.controller.ts · tasks.service.ts · tasks.module.ts
    dto/ (create, update, list-query, transforms)
test/                                      # integración HTTP, migraciones y persistencia en archivo
.github/workflows/ci.yml                    # instalación, tipos, build y tests
```

## Decisiones

- **NestJS** por su validación declarativa (DTOs + `class-validator`) y módulos claros; **SQLite** para que se ejecute
  sin instalar un servidor de BD. Pasar a PostgreSQL requiere configurar el driver y la conexión, adaptar
  los tipos y las migraciones (incluidos `datetime('now')` e índices), y probar las consultas contra ese motor.
- **Organización por funcionalidad:** controlador, servicio, DTOs y entidad dentro de `tasks/`, con configuración
  y migraciones en `database/`. El controlador recibe peticiones, el servicio contiene las operaciones y
  el repositorio de TypeORM accede a los datos. Para este alcance no se añadieron repositorios propios ni CQRS.
- **Campos opcionales:** se mantuvo la interpretación inicial de que descripción, responsable y fecha límite
  pueden faltar; título es obligatorio y estado tiene un valor por defecto. Si el negocio exige los cinco campos,
  habría que ajustar validación, esquema y tests. Los filtros de estado y responsable también son opcionales.
- **El esquema solo cambia por migraciones** (`synchronize: false`). La migración tiene `up` y `down` y está probada.
- **Doble barrera de validación:** DTOs en la API (`whitelist` + `forbidNonWhitelisted`: un campo desconocido es un 400,
  no se ignora en silencio) y un `CHECK` en la BD para `status`.
- **PATCH, no PUT**: editar una tarea suele ser cambiar un campo (p. ej. el estado). `null` vacía descripción,
  responsable o fecha límite; título y estado nunca pueden ser `null`.
- **Fechas:** se acepta un subconjunto explícito de ISO 8601, se comprueba el calendario
  (`2026-02-30` es un 400) y solo entonces se normaliza a UTC. Exigir zona cuando hay hora evita
  que el resultado dependa de la configuración del servidor.
- **Responsable como texto libre.** El enunciado no pide usuarios; una tabla `users` sería sobreingeniería aquí.
- **Paginación con desempate determinista** (`created_at DESC, id`): mantiene un orden estable mientras
  los datos no cambien. Las inserciones o borrados entre peticiones pueden desplazar las páginas;
  para ese escenario se consideraría paginación por cursor. Fuera de rango devuelve `200` con `data: []`.
- **UUID** como id: dificulta adivinar identificadores; no sustituye autenticación ni autorización.
- **Índice de expresión:** una segunda migración reemplaza el índice de responsable por uno sobre
  `LOWER(assignee)`, coherente con el filtro. Se prueba su uso, reversión y conservación de datos existentes.
- **Tests sobre la app real** (mismos pipes que producción) con SQLite en memoria y el esquema creado por las
  migraciones reales, no por `synchronize`. Cubren CRUD, validación, filtros, paginación y migración up/down.
  Otra prueba reinicia la aplicación con una BD temporal en archivo para comprobar persistencia.
- **Swagger como interfaz de exploración:** `/docs` documenta y permite probar el contrato, con esquemas de respuesta
  separados de la entidad de persistencia. `/docs-json` permite exportarlo. El arranque muestra el enlace a `/docs`
  usando el puerto configurado, para no dirigir al usuario a una raíz sin endpoint.
- **Verificación reproducible:** Node 24 declarado en `engines` y `.nvmrc`, instalación con `npm ci` y un workflow
  de CI que comprueba tipos, compila y ejecuta tests. La ejecución remota de CI debe comprobarse al subir el repositorio.

## Qué haría con más tiempo

- **Orden dentro del mismo segundo:** `created_at` tiene resolución de segundos en SQLite, así que tareas creadas en el
  mismo segundo se ordenan por `id` (estable, pero no por orden de creación). Guardar milisegundos o usar un id
  ordenable (ULID/UUIDv7) lo resuelve.
- Autenticación y que el responsable sea un usuario real; ordenación configurable (`sort=dueDate`) y filtro por rango de fechas.
- Probar contra PostgreSQL real (docker-compose + CI) y añadir `GET /health`.
- Logging estructurado y límite de peticiones.
- Formato y lint automáticos con reglas compartidas.
- Test del arranque completo (`npm start` sobre un fichero de BD) y de concurrencia en las escrituras.
- Paginación por cursor si se necesita recorrer datos mientras se insertan o eliminan tareas, y búsqueda por
  responsable con reglas Unicode explícitas.
- Un comando de seed opcional y repetible para cargar ejemplos en una instalación nueva.
- Para despliegues con varias instancias, ejecutar migraciones en una etapa controlada antes de arrancar servidores,
  en lugar de aplicarlas automáticamente en cada instancia.

## Cómo usé la IA

**Qué se aceptó sin cambios:** la estructura por módulos, el uso de `class-validator`, SQLite con migraciones
al arrancar, PATCH en lugar de PUT, y el diseño de la respuesta paginada.

**Qué se corrigió, y cómo se detectó.** Los fallos no se vieron leyendo código: salieron al **ejecutar el servicio de
verdad** (`curl` contra un servidor levantado) y al ejecutar los tests.

1. **Fechas imposibles aceptadas.** Mi normalización a UTC corría antes de validar y `new Date('2026-02-30')`
   devuelve el 2 de marzo, así que `2026-02-30` se aceptaba y se guardaba cambiada. Ahora solo se normaliza si el valor
   original ya pasa la validación estricta; hay un test que lo fija.
2. **`GET /tasks/abc` devolvía 404** en vez de 400. Se añadió `ParseUUIDPipe`.
3. **PATCH con cuerpo `{}`** devolvía 200 sin hacer nada; ahora es 400.
4. **TypeScript 7** se instaló por defecto y rompió `ts-node`/`ts-jest` (`Cannot read properties of undefined (reading 'fileExists')`).
   Se fijó TypeScript 5.9.
5. **NestJS 12 es solo ESM:** Jest no podía cargarlo y, además, `npm start` solo habría funcionado en Node ≥ 22.12.
   Se bajó a NestJS 11 y TypeORM 0.3 (CommonJS). La revisión posterior corrigió la compatibilidad anunciada:
   las dependencias actuales no soportan Node 18; este proyecto se verifica con Node 24.

**Cómo comprobé que los tests sirven:** rompí a propósito el código (quité el filtro sin mayúsculas y desactivé
`forbidNonWhitelisted`) y confirmé que los tests correspondientes fallaban antes de restaurarlo.

### Nuestra interacción con la IA

**Qué se corrigió y por qué:**

| Hallazgo o ajuste solicitado                                            | Cambio realizado                                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Las fechas ISO semanales y compactas provocaban `500`.                  | Se definieron formatos admitidos y se añadieron tests de regresión; ahora devuelven `400`.                                                 |
| Las horas sin zona dependían de la zona del servidor.                   | Se exige zona explícita cuando se envía hora y se normaliza a UTC.                                                                         |
| `page=1e100` pasaba la validación y provocaba `500`.                    | Se limitó `page` a 1.000.000 para mantener un desplazamiento seguro.                                                                       |
| El filtro `LOWER(assignee)` no aprovechaba el índice simple.            | Se añadió una nueva migración reversible con un índice de expresión, conservando los datos existentes.                                     |
| El README anunciaba Node 18, incompatible con las dependencias fijadas. | Se declaró Node 24 y se ajustaron las instrucciones y CI.                                                                                  |
| Faltaba una interfaz para explorar y probar los endpoints.              | Se integró `@nestjs/swagger` compatible con NestJS 11 en `/docs`, con contrato en `/docs-json`.                                            |
| La URL raíz del mensaje de arranque devolvía `404`.                     | Se cambió el mensaje para mostrar únicamente el enlace a `/docs`; no se creó un endpoint raíz.                                             |
| Algunas explicaciones del README eran demasiado generales.              | Se precisaron la carga de variables de entorno, los límites de paginación, el uso de UUID y el trabajo necesario para migrar a PostgreSQL. |

**Cómo se comprobó:** los nuevos tests de fechas y paginación fallaron antes de corregir el código y pasaron
después. La suite quedó en **28 tests**, junto con comprobación de tipos y build correctos. Incluye una prueba
del contrato OpenAPI, uso y reversión del índice, y persistencia tras reiniciar la aplicación con SQLite en archivo.
Se comprobaron por HTTP la interfaz de Swagger, su contrato y los archivos necesarios para cargarla.

Además se crearon seis tareas con distintos estados y responsables y se probaron por HTTP creación (`201`),
consulta/listado/filtros/paginación (`200`), edición parcial y limpieza de campos con `null` (`200`), borrado (`204`),
recursos inexistentes (`404`) y datos inválidos (`400`). Se conservaron los seis ejemplos y se eliminó una séptima
tarea temporal usada para probar DELETE. Estos datos no se incluyeron en Git.

**Proceso:** las correcciones se guardaron en commits separados de validación, índice, persistencia,
configuración/documentación, Swagger y ajuste del mensaje de arranque. El historial permite revisar cada cambio.
