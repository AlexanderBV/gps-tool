<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto flex min-h-screen flex-col gap-6 p-6 lg:flex-row">
      <div class="w-full lg:w-3/5 lg:h-[calc(100vh-3rem)]">
        <MapContainer />
      </div>
      <div class="w-full lg:w-2/5 lg:h-[calc(100vh-3rem)]">
        <div class="h-full overflow-y-auto">
          <PositionsPanelContainer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { usePositionsStore } from './stores/positions';
import { useGpsConfigStore } from './stores/gpsConfig';
import { useGpsSimulator } from './composables/useGpsSimulator';
import MapContainer from './components/MapContainer.vue';
import PositionsPanelContainer from './components/PositionsPanelContainer.vue';

// Cargar configuración GPS desde localStorage al iniciar.
// Si existe config guardada, sobreescribe los valores del .env.
const configStore = useGpsConfigStore();
configStore.load();

const store = usePositionsStore();
const simulatorApi = useGpsSimulator(store);

provide('simulatorApi', simulatorApi);
</script>
