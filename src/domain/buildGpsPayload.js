const hasOverride = (position, key) =>
  position.overrides && Object.prototype.hasOwnProperty.call(position.overrides, key);

const resolveField = (position, defaults, key) =>
  hasOverride(position, key) ? position.overrides[key] : defaults[key];

export const buildGpsPayload = (position, defaults, deviceTimestampUnix) => ({
  lat: position.lat,
  lng: position.lng,
  plate: resolveField(position, defaults, 'plate'),
  velocity: resolveField(position, defaults, 'velocity'),
  imei: resolveField(position, defaults, 'imei'),
  altitude: resolveField(position, defaults, 'altitude'),
  angle: resolveField(position, defaults, 'angle'),
  odometer: resolveField(position, defaults, 'odometer'),
  level_fuel: resolveField(position, defaults, 'level_fuel'),
  fuel_tank: resolveField(position, defaults, 'fuel_tank'),
  engine: resolveField(position, defaults, 'engine'),
  device_timestamp: deviceTimestampUnix
});
