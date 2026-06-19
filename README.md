# GPS Simulator

Herramienta web para enviar posiciones GPS a un microservicio externo. Permite cargar puntos en un mapa interactivo, configurar la conexión con la API desde la propia interfaz y ejecutar envíos automáticos o manuales.

## Requisitos

- **Node.js** 18 o superior
- **npm** 9 o superior

## Instalación

```bash
git clone git@github.com:AlexanderBV/gps-tool.git
cd gps-tool
npm install
```

Copia la plantilla de variables de entorno y ajusta los valores para tu máquina:

```bash
cp .env.example .env
# Edita .env con tu URL, token y proxy (ver sección más abajo)
```

## Levantar en desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173` (o el puerto que indique Vite si ya está ocupado).

## Build de producción

```bash
npm run build       # genera dist/
npm run preview     # sirve dist/ localmente para verificar
```

---

## Configurar la conexión con la API GPS

La URL y el token **no están hardcodeados**: se configuran desde la propia interfaz y se guardan en el `localStorage` del navegador.

### Opción A — desde la UI (recomendado)

1. Abre la app en el navegador.
2. Haz clic en el ícono **⚙ (engranaje)** que aparece en la esquina superior derecha del panel.
3. Ingresa la **URL** del endpoint GPS (p. ej. `https://api.ejemplo.com/gps/position`).
4. Ingresa el **Bearer token** de autenticación.
5. Haz clic en **Guardar**. La configuración persiste entre sesiones.

### Opción B — valores por defecto vía `.env`

Si quieres que la app arranque con valores preconfigurados sin tener que usar el modal, edita `.env`:

```env
VITE_GPS_API_URL=http://gps-api.test/api/gps-tracker
VITE_GPS_API_TOKEN=tu_bearer_token_aqui
```

Estos valores actúan como **fallback**: si el usuario ya guardó una configuración desde la UI mediante el modal ⚙, el `.env` es ignorado.

> `.env` **nunca** se sube al repositorio (está en `.gitignore`). Copia `.env.example` como punto de partida.

---

## Solución de problemas CORS (desarrollo local)

Los navegadores bloquean peticiones cross-origin, por lo que `http://gps-api.test` falla en el navegador aunque funcione en curl o Insomnia. La app incluye un **proxy de Vite** que resuelve esto sin tocar la API.

### Configuración (una vez por desarrollador)

Agrega esta variable a tu `.env`:

```env
VITE_GPS_DEV_PROXY=http://gps-api.test
```

Reinicia el servidor de desarrollo (`npm run dev`). A partir de ese momento las peticiones a `http://gps-api.test` se redirigen automáticamente a través del servidor de Vite, evitando el CORS. **No necesitas cambiar la URL en el modal ⚙**.

### Cómo funciona

```
Navegador → localhost:5173/gps-proxy/api/gps-tracker
                    ↓  (Vite proxy, servidor a servidor)
             http://gps-api.test/api/gps-tracker
```

El proxy solo aplica en modo desarrollo. En producción, las peticiones van directo a la URL configurada.

### Alternativa: configurar CORS en la API Laravel

Si prefieres no usar el proxy (por ejemplo, la API está en un servidor remoto), puedes configurar CORS en el proyecto Laravel del microservicio GPS:

```php
// config/cors.php
'allowed_origins' => ['http://localhost:5173'],
```

```bash
php artisan config:clear
```

---

## Cómo usar la herramienta

### 1. Cargar posiciones

Haz clic en el mapa para agregar puntos GPS. Cada punto aparece en la tabla con su latitud, longitud y los campos de la plataforma GPS (placa, velocidad, odómetro, etc.).

### 2. Configurar defaults globales

En la sección **Defaults globales** puedes establecer valores que se aplican a todos los puntos que no tengan un override individual (placa, velocidad, odómetro).

### 3. Envío automático

- Ajusta el **Intervalo (s)** (segundos entre envíos).
- Pulsa **Start** para iniciar el ciclo automático punto a punto.
- **Pause** congela el ciclo; **Stop** lo reinicia desde el principio.

### 4. Envío manual

Desde la tabla, usa el botón de avión (✈) junto a un punto para enviarlo de forma inmediata.

### 5. Ver detalles de un envío

Haz clic en el ícono de ojo (👁) de cualquier fila para abrir el modal de detalles. Verás la request completa (URL, headers, body) y la respuesta del servidor. Si el envío falló, aparece un banner de error en rojo con la descripción del problema.

---

## Mensajes de error comunes

| Error | Causa | Solución |
|---|---|---|
| `GPS API URL no configurada` | No se ha guardado la URL | Abre ⚙ y guarda la URL |
| `GPS API Token no configurado` | No se ha guardado el token | Abre ⚙ y guarda el token |
| `Sin conexión con el servidor` | La URL no es alcanzable | Verifica la URL en ⚙ |
| `Token inválido o expirado (401)` | El token fue rechazado | Actualiza el token en ⚙ |
| `Endpoint no encontrado (404)` | La URL no existe | Verifica la ruta en ⚙ |
| `Error interno del servidor (5xx)` | Fallo en el microservicio GPS | Revisa los logs del servidor |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── GpsConfigModal.vue       # Modal de configuración (URL + token)
│   ├── MapContainer.vue         # Mapa interactivo (Leaflet)
│   ├── PositionsPanelContainer  # Lógica del panel (smart component)
│   └── PositionsPanelView.vue   # UI del panel (presentational component)
├── composables/
│   └── useGpsSimulator.js       # Lógica de envío, reintentos y clasificación de errores
├── services/
│   └── gpsClient.js             # Cliente HTTP que llama a la API GPS
├── stores/
│   ├── gpsConfig.js             # Pinia store: URL + token (persiste en localStorage)
│   └── positions.js             # Pinia store: lista de posiciones y estado del simulador
└── App.vue
```

## Stack

- [Vue 3](https://vuejs.org/) + Composition API (`<script setup>`)
- [Pinia](https://pinia.vuejs.org/) — gestión de estado
- [Vite](https://vitejs.dev/) — bundler
- [Tailwind CSS](https://tailwindcss.com/) — estilos
- [Vue Leaflet](https://vue-leaflet.github.io/vue-leaflet/) — mapa interactivo
- [Heroicons](https://heroicons.com/) — iconografía
- [SweetAlert2](https://sweetalert2.github.io/) — diálogos de confirmación
