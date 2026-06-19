import { useGpsConfigStore } from '../stores/gpsConfig';

/**
 * En desarrollo, si VITE_GPS_DEV_PROXY está configurado y el origin de la URL
 * coincide, enruta la petición a través del proxy de Vite (/gps-proxy/...)
 * para evitar errores de CORS. En producción siempre usa la URL directa.
 */
const buildFetchUrl = (configuredUrl) => {
  const proxyTarget = import.meta.env.VITE_GPS_DEV_PROXY;
  if (!import.meta.env.DEV || !proxyTarget) return configuredUrl;

  try {
    const proxyOrigin = new URL(proxyTarget).origin;
    const configOrigin = new URL(configuredUrl).origin;
    if (configOrigin === proxyOrigin) {
      const parsed = new URL(configuredUrl);
      return '/gps-proxy' + parsed.pathname + parsed.search;
    }
  } catch {
    // URL inválida, usar tal cual
  }

  return configuredUrl;
};

export const sendGpsPayload = async (payload, options = {}) => {
  const config = useGpsConfigStore();
  const url = config.apiUrl;
  const token = config.apiToken;

  if (!url) {
    throw new Error('GPS API URL no configurada. Usa el ícono ⚙ para configurarla.');
  }
  if (!token) {
    throw new Error('GPS API Token no configurado. Usa el ícono ⚙ para configurarlo.');
  }

  const fetchUrl = buildFetchUrl(url);

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: options.signal
  });

  const bodyText = await response.text();
  let bodyJson = null;
  try {
    bodyJson = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    bodyJson = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    bodyText,
    bodyJson
  };
};
