<template>
  <PositionsPanelView
    :now-unix="nowUnix"
    :now-human="nowHuman"
    :interval-seconds="store.simulation.intervalSeconds"
    :is-running="store.simulation.running"
    :is-paused="store.simulation.paused"
    :is-sending="isSending"
    :has-positions="store.hasPositions"
    :positions="positionsView"
    :selected-position-id="store.selectedPositionId"
    :selected-index="selectedIndex"
    :selected-position="store.selectedPosition"
    :selected-effective="selectedEffective"
    :overridden-keys="overriddenKeys"
    :defaults="store.defaults"
    :fields="fields"
    :defaults-fields="defaultsFields"
    :status-classes="statusClasses"
    :details-position="detailsPosition"
    :api-url="configStore.apiUrl"
    @start="startSimulation"
    @pause="pauseSimulation"
    @stop="stopSimulation"
    @update-interval="handleIntervalUpdate"
    @select-position="store.selectPosition"
    @remove-position="store.removePosition"
    @clear-positions="store.clearPositions"
    @update-default="handleDefaultUpdate"
    @apply-defaults="store.applyDefaultsToAllPositions"
    @update-selected-lat="handleSelectedLatUpdate"
    @update-selected-lng="handleSelectedLngUpdate"
    @update-selected-override="handleSelectedOverrideUpdate"
    @reset-selected-overrides="handleResetOverrides"
    @open-details="openDetails"
    @close-details="closeDetails"
    @send-now="handleSendNow"
    @open-config="showConfigModal = true"
  />

  <GpsConfigModal
    v-if="showConfigModal"
    :initial-url="configStore.apiUrl"
    :initial-token="configStore.apiToken"
    @close="showConfigModal = false"
    @save="handleConfigSave"
  />
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import Swal from 'sweetalert2';
import { usePositionsStore } from '../stores/positions';
import { useGpsConfigStore } from '../stores/gpsConfig';
import { useNowTimestamp } from '../composables/useNowTimestamp';
import { useGpsSimulator } from '../composables/useGpsSimulator';
import PositionsPanelView from './PositionsPanelView.vue';
import GpsConfigModal from './GpsConfigModal.vue';

const store = usePositionsStore();
const configStore = useGpsConfigStore();
const { nowUnix, nowHuman } = useNowTimestamp();

const injectedSimulator = inject('simulatorApi', null);
const { startSimulation, pauseSimulation, stopSimulation, sendPositionNow, isSending } =
  injectedSimulator || useGpsSimulator(store);

const fields = [
  { key: 'plate', label: 'Plate', type: 'text' },
  { key: 'velocity', label: 'Velocity', type: 'number', step: '1' },
  { key: 'odometer', label: 'Odometer', type: 'number', step: '1' },
  { key: 'imei', label: 'IMEI', type: 'text' },
  { key: 'altitude', label: 'Altitude', type: 'number', step: '1' },
  { key: 'angle', label: 'Angle', type: 'number', step: '1' },
  { key: 'level_fuel', label: 'Level fuel', type: 'number', step: '1' },
  { key: 'fuel_tank', label: 'Fuel tank', type: 'number', step: '1' },
  { key: 'engine', label: 'Engine', type: 'number', step: '1' }
];

const defaultsFields = [
  { key: 'plate', label: 'Plate', type: 'text' },
  { key: 'velocity', label: 'Velocity', type: 'number', step: '1' },
  { key: 'odometer', label: 'Odometer', type: 'number', step: '1' }
];

const numericFields = new Set([
  'velocity',
  'odometer',
  'altitude',
  'angle',
  'level_fuel',
  'fuel_tank',
  'engine'
]);

const parseFieldValue = (key, value) => {
  if (!numericFields.has(key)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveEffectiveValue = (position, key) =>
  Object.prototype.hasOwnProperty.call(position.overrides || {}, key)
    ? position.overrides[key]
    : store.defaults[key];

const nextCountdown = computed(() => {
  if (!store.simulation.running || store.simulation.paused) return null;
  if (!store.simulation.nextSendAtUnix) return null;
  const diff = store.simulation.nextSendAtUnix - nowUnix.value;
  return diff > 0 ? diff : 0;
});

const positionsView = computed(() =>
  store.positions.map((position, index) => ({
    ...position,
    index: index + 1,
    effectivePlate: resolveEffectiveValue(position, 'plate'),
    effectiveVelocity: resolveEffectiveValue(position, 'velocity'),
    effectiveOdometer: resolveEffectiveValue(position, 'odometer'),
    canSendNow:
      !isSending.value &&
      position.status === 'PENDING' &&
      (!store.simulation.running ||
        (!store.simulation.paused && index === store.simulation.currentIndex)),
    countdownSeconds:
      store.simulation.running &&
      !store.simulation.paused &&
      position.status === 'PENDING' &&
      index === store.simulation.currentIndex &&
      nextCountdown.value !== null
        ? nextCountdown.value
        : null
  }))
);

const selectedIndex = computed(() => {
  const match = positionsView.value.find((position) => position.id === store.selectedPositionId);
  return match ? match.index : null;
});

const overriddenKeys = computed(() => Object.keys(store.selectedPosition?.overrides || {}));

const selectedEffective = computed(() => {
  if (!store.selectedPosition) return {};
  const effective = {
    lat: store.selectedPosition.lat,
    lng: store.selectedPosition.lng
  };

  fields.forEach((field) => {
    const isOverridden = overriddenKeys.value.includes(field.key);
    effective[field.key] = isOverridden
      ? store.selectedPosition.overrides[field.key]
      : store.defaults[field.key];
  });

  return effective;
});

const statusClasses = {
  PENDING: 'bg-slate-800 text-slate-300',
  SENDING: 'bg-amber-400/20 text-amber-300',
  SENT: 'bg-emerald-400/20 text-emerald-300',
  FAILED: 'bg-rose-500/20 text-rose-300'
};

const detailsPositionId = ref(null);
const showConfigModal = ref(false);

const detailsPosition = computed(() =>
  positionsView.value.find((position) => position.id === detailsPositionId.value) || null
);

const handleConfigSave = (url, token) => {
  configStore.save(url, token);
  showConfigModal.value = false;
};

const openDetails = (positionId) => {
  detailsPositionId.value = positionId;
  store.selectPosition(positionId);
};

const closeDetails = () => {
  detailsPositionId.value = null;
};

const handleIntervalUpdate = (value) => {
  store.setIntervalSeconds(value);
};

const handleDefaultUpdate = (key, value) => {
  store.setDefaults({ [key]: parseFieldValue(key, value) });
};

const handleSelectedOverrideUpdate = (key, value) => {
  if (!store.selectedPosition) return;
  store.updatePositionOverrides(store.selectedPosition.id, {
    [key]: parseFieldValue(key, value)
  });
};

const handleResetOverrides = () => {
  if (!store.selectedPosition) return;
  store.resetPositionOverrides(store.selectedPosition.id);
};

const handleSelectedLatUpdate = (value) => {
  if (!store.selectedPosition) return;
  const lat = Number(value);
  if (!Number.isFinite(lat)) return;
  store.updatePositionLatLng(store.selectedPosition.id, lat, store.selectedPosition.lng);
};

const handleSelectedLngUpdate = (value) => {
  if (!store.selectedPosition) return;
  const lng = Number(value);
  if (!Number.isFinite(lng)) return;
  store.updatePositionLatLng(store.selectedPosition.id, store.selectedPosition.lat, lng);
};

const handleSendNow = async (positionId) => {
  const result = await Swal.fire({
    title: 'Enviar punto ahora',
    text: 'Se enviará inmediatamente y el siguiente envío respetará el intervalo.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Enviar ahora',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (!result.isConfirmed) return;
  sendPositionNow(positionId);
};
</script>
