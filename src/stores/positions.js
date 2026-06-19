import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { formatUnixTimestamp } from '../domain/formatTimestamp';

export const POSITION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
});

const DEFAULTS_TEMPLATE = Object.freeze({
  plate: 'OSS1',
  velocity: 40,
  odometer: 158000,
  imei: 'OSS1',
  altitude: 10,
  angle: 360,
  level_fuel: 50,
  fuel_tank: 80,
  engine: 1
});

export const usePositionsStore = defineStore('positions', () => {
  const positions = ref([]);
  const defaults = ref({ ...DEFAULTS_TEMPLATE });
  const simulation = ref({
    running: false,
    paused: false,
    currentIndex: 0,
    intervalSeconds: 3,
    nextSendAtUnix: null
  });
  const selectedPositionId = ref(null);

  const selectedPosition = computed(() =>
    positions.value.find((position) => position.id === selectedPositionId.value) || null
  );

  const hasPositions = computed(() => positions.value.length > 0);

  const createId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const createPosition = (lat, lng) => ({
    id: createId(),
    lat,
    lng,
    status: POSITION_STATUS.PENDING,
    statusCode: null,
    sentAtUnix: null,
    sentAtHuman: '',
    statusInfo: '',
    overrides: {},
    lastRequestPayload: null,
    lastResponse: null
  });

  const addPosition = (lat, lng) => {
    const position = createPosition(lat, lng);
    positions.value.push(position);
    selectedPositionId.value = position.id;
  };

  const updatePositionLatLng = (positionId, lat, lng) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.lat = lat;
    position.lng = lng;
  };

  const updatePositionOverrides = (positionId, overrides) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.overrides = {
      ...position.overrides,
      ...overrides
    };
  };

  const resetPositionOverrides = (positionId) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.overrides = {};
  };

  const applyDefaultsToAllPositions = () => {
    positions.value = positions.value.map((position) => ({
      ...position,
      overrides: { ...defaults.value }
    }));
  };

  const removePosition = (positionId) => {
    positions.value = positions.value.filter((item) => item.id !== positionId);
    if (selectedPositionId.value === positionId) {
      selectedPositionId.value = positions.value[0]?.id || null;
    }
  };

  const clearPositions = () => {
    positions.value = [];
    selectedPositionId.value = null;
    resetSimulation();
  };

  const selectPosition = (positionId) => {
    selectedPositionId.value = positionId;
  };

  const setDefaults = (partialDefaults) => {
    defaults.value = {
      ...defaults.value,
      ...partialDefaults
    };
  };

  const setIntervalSeconds = (value) => {
    const sanitized = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
    simulation.value.intervalSeconds = sanitized;
  };

  const setSimulationRunning = (running) => {
    simulation.value.running = running;
  };

  const setSimulationPaused = (paused) => {
    simulation.value.paused = paused;
  };

  const setSimulationIndex = (index) => {
    simulation.value.currentIndex = index;
  };

  const markPositionAsSending = (positionId, payload) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.status = POSITION_STATUS.SENDING;
    position.statusCode = null;
    position.statusInfo = '';
    position.lastRequestPayload = payload || null;
    position.lastResponse = null;
  };

  const markPositionAsSent = (
    positionId,
    sentAtUnix,
    statusCode,
    responseInfo,
    requestPayload
  ) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.status = POSITION_STATUS.SENT;
    position.statusCode = statusCode ?? null;
    position.sentAtUnix = sentAtUnix;
    position.sentAtHuman = formatUnixTimestamp(sentAtUnix);
    position.statusInfo = '';
    position.lastResponse = responseInfo || null;
    if (requestPayload) {
      position.lastRequestPayload = requestPayload;
    }
  };

  const markPositionAsFailed = (
    positionId,
    sentAtUnix,
    errorMessage,
    responseInfo,
    requestPayload
  ) => {
    const position = positions.value.find((item) => item.id === positionId);
    if (!position) return;
    position.status = POSITION_STATUS.FAILED;
    position.statusCode = responseInfo?.status ?? null;
    position.sentAtUnix = sentAtUnix;
    position.sentAtHuman = formatUnixTimestamp(sentAtUnix);
    position.statusInfo = errorMessage || 'Request failed';
    position.lastResponse = responseInfo || null;
    if (requestPayload) {
      position.lastRequestPayload = requestPayload;
    }
  };

  const resetSimulation = () => {
    simulation.value.running = false;
    simulation.value.paused = false;
    simulation.value.currentIndex = 0;
    simulation.value.nextSendAtUnix = null;
    positions.value = positions.value.map((position) => ({
      ...position,
      status: POSITION_STATUS.PENDING,
      statusCode: null,
      sentAtUnix: null,
      sentAtHuman: '',
      statusInfo: '',
      lastRequestPayload: null,
      lastResponse: null
    }));
  };

  const setNextSendAtUnix = (value) => {
    simulation.value.nextSendAtUnix = value;
  };

  return {
    positions,
    defaults,
    simulation,
    selectedPositionId,
    selectedPosition,
    hasPositions,
    addPosition,
    updatePositionLatLng,
    updatePositionOverrides,
    resetPositionOverrides,
    applyDefaultsToAllPositions,
    removePosition,
    clearPositions,
    selectPosition,
    setDefaults,
    setIntervalSeconds,
    setSimulationRunning,
    setSimulationPaused,
    setSimulationIndex,
    setNextSendAtUnix,
    markPositionAsSending,
    markPositionAsSent,
    markPositionAsFailed,
    resetSimulation
  };
});
