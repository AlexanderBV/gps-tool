import { ref } from 'vue';
import { buildGpsPayload } from '../domain/buildGpsPayload';
import { sendGpsPayload } from '../services/gpsClient';

const RETRY_DELAYS_MS = [500, 1500];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Traduce un error de envío a un mensaje claro y accionable.
 */
const classifyError = (error, attempts) => {
  const status = error?.status ?? error?.responseInfo?.status ?? null;
  const raw = error?.message || '';
  const retriesLabel = attempts >= MAX_ATTEMPTS ? ` (${attempts} intentos)` : '';

  // Errores de configuración — lanzados por gpsClient antes del fetch
  if (raw.includes('no configurada') || raw.includes('no configurado')) {
    return raw; // Ya es descriptivo
  }

  // Errores de red — sin respuesta HTTP
  if (!status) {
    if (/failed to fetch|networkerror|network request failed/i.test(raw)) {
      return `Sin conexión con el servidor — verifica la URL configurada${retriesLabel}`;
    }
    if (/aborted|abort|signal/i.test(raw)) {
      return `Solicitud cancelada${retriesLabel}`;
    }
    return `Error de red: ${raw}${retriesLabel}`;
  }

  // Errores HTTP con código de estado
  const httpMessages = {
    400: 'Datos inválidos rechazados por el servidor',
    401: 'Token inválido o expirado — actualiza el token en ⚙',
    403: 'Sin permisos para acceder al endpoint',
    404: 'Endpoint no encontrado — verifica la URL en ⚙',
    405: 'Método no permitido (se esperaba POST)',
    408: 'Tiempo de espera agotado',
    413: 'Payload demasiado grande',
    422: 'Datos rechazados: el servidor no puede procesarlos',
    429: 'Rate limit alcanzado — demasiadas solicitudes',
    500: 'Error interno del servidor',
    502: 'Bad Gateway — el servidor no está disponible',
    503: 'Servicio no disponible temporalmente',
    504: 'Gateway Timeout — sin respuesta del servidor',
  };

  const desc = httpMessages[status] || `Error del servidor`;
  return `${desc} (HTTP ${status})${retriesLabel}`;
};

export const useGpsSimulator = (store) => {
  const isSending = ref(false);
  let timerId;
  let sessionId = 0;

  const stopTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const stopSimulationInternal = () => {
    store.setSimulationRunning(false);
    store.setSimulationPaused(false);
    store.setSimulationIndex(0);
    store.setNextSendAtUnix(null);
    stopTimer();
  };

  const scheduleNext = (sessionMarker) => {
    if (sessionMarker !== sessionId) return;
    if (!store.simulation.running || store.simulation.paused) return;

    if (store.simulation.currentIndex >= store.positions.length) {
      stopSimulationInternal();
      return;
    }

    stopTimer();
    const nextAtUnix = Math.floor(Date.now() / 1000) + store.simulation.intervalSeconds;
    store.setNextSendAtUnix(nextAtUnix);
    timerId = setTimeout(
      () => executeCurrent(sessionMarker),
      store.simulation.intervalSeconds * 1000
    );
  };

  const sendWithRetries = async (position) => {
    let lastError;
    let lastResponseInfo;
    let attempts = 0;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      attempts += 1;
      const deviceTimestampUnix = Math.floor(Date.now() / 1000);
      const payload = buildGpsPayload(position, store.defaults, deviceTimestampUnix);

      try {
        const response = await sendGpsPayload(payload);
        if (response.ok) {
          return {
            status: response.status,
            sentAtUnix: deviceTimestampUnix,
            requestPayload: payload,
            responseInfo: {
              status: response.status,
              ok: response.ok,
              bodyText: response.bodyText,
              bodyJson: response.bodyJson
            }
          };
        }

        lastError = new Error(`HTTP ${response.status}`);
        lastError.status = response.status;
        lastError.sentAtUnix = deviceTimestampUnix;
        lastError.requestPayload = payload;
        lastResponseInfo = {
          status: response.status,
          ok: response.ok,
          bodyText: response.bodyText,
          bodyJson: response.bodyJson
        };
      } catch (error) {
        lastError = error;
        if (!lastError.sentAtUnix) {
          lastError.sentAtUnix = deviceTimestampUnix;
        }
        lastError.requestPayload = payload;
        lastResponseInfo = {
          status: null,
          ok: false,
          bodyText: error?.message || 'Request failed',
          bodyJson: null
        };
      }

      if (attempt < RETRY_DELAYS_MS.length) {
        await wait(RETRY_DELAYS_MS[attempt]);
      }
    }

    if (lastError) {
      lastError.responseInfo = lastResponseInfo;
      lastError.attempts = attempts;
    }
    throw lastError;
  };

  const executeCurrent = async (sessionMarker) => {
    if (sessionMarker !== sessionId) return;
    if (!store.simulation.running || store.simulation.paused || isSending.value) return;

    const position = store.positions[store.simulation.currentIndex];
    if (!position) {
      stopSimulationInternal();
      return;
    }

    isSending.value = true;
    store.setNextSendAtUnix(null);
    store.markPositionAsSending(position.id, null);

    try {
      const result = await sendWithRetries(position);
      if (sessionMarker !== sessionId) return;
      store.markPositionAsSent(
        position.id,
        result.sentAtUnix,
        result.status,
        result.responseInfo,
        result.requestPayload
      );
    } catch (error) {
      if (sessionMarker !== sessionId) return;
      const sentAtUnix = error?.sentAtUnix || Math.floor(Date.now() / 1000);
      store.markPositionAsFailed(
        position.id,
        sentAtUnix,
        classifyError(error, error?.attempts ?? 1),
        error?.responseInfo || null,
        error?.requestPayload || null
      );
    } finally {
      isSending.value = false;
      if (sessionMarker !== sessionId) return;
      store.setSimulationIndex(store.simulation.currentIndex + 1);
      scheduleNext(sessionMarker);
    }
  };

  const startSimulation = () => {
    if (!store.hasPositions) return;
    if (store.simulation.running && !store.simulation.paused) return;

    if (!store.simulation.running) {
      sessionId += 1;
    }

    if (store.simulation.currentIndex >= store.positions.length) {
      store.setSimulationIndex(0);
    }

    store.setSimulationRunning(true);
    store.setSimulationPaused(false);
    store.setNextSendAtUnix(null);
    stopTimer();
    executeCurrent(sessionId);
  };

  const pauseSimulation = () => {
    if (!store.simulation.running) return;
    store.setSimulationPaused(true);
    store.setNextSendAtUnix(null);
    stopTimer();
  };

  const stopSimulation = () => {
    sessionId += 1;
    store.setNextSendAtUnix(null);
    stopTimer();
    store.resetSimulation();
  };

  const sendPositionNow = async (positionId) => {
    if (isSending.value) return;
    const positionIndex = store.positions.findIndex((item) => item.id === positionId);
    if (positionIndex === -1) return;

    const position = store.positions[positionIndex];
    if (!position) return;

    stopTimer();
    store.setNextSendAtUnix(null);
    isSending.value = true;
    store.markPositionAsSending(position.id, null);

    try {
      const result = await sendWithRetries(position);
      store.markPositionAsSent(
        position.id,
        result.sentAtUnix,
        result.status,
        result.responseInfo,
        result.requestPayload
      );
    } catch (error) {
      const sentAtUnix = error?.sentAtUnix || Math.floor(Date.now() / 1000);
      store.markPositionAsFailed(
        position.id,
        sentAtUnix,
        classifyError(error, error?.attempts ?? 1),
        error?.responseInfo || null,
        error?.requestPayload || null
      );
    } finally {
      isSending.value = false;
      if (store.simulation.running && !store.simulation.paused) {
        if (positionIndex === store.simulation.currentIndex) {
          store.setSimulationIndex(store.simulation.currentIndex + 1);
        }
        scheduleNext(sessionId);
      }
    }
  };

  return {
    isSending,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    sendPositionNow
  };
};
