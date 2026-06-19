import { useGpsConfigStore } from '../stores/gpsConfig';

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

  const response = await fetch(url, {
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
