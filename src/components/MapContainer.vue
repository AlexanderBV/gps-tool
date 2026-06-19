<template>
  <MapView
    :center="center"
    :zoom="zoom"
    :markers="markers"
    :selected-position-id="store.selectedPositionId"
    :on-map-click="handleMapClick"
    :on-marker-drag-end="handleMarkerDragEnd"
    :on-marker-click="handleMarkerClick"
    :on-delete-selected="deleteSelected"
    :on-clear-all="clearAll"
  />
</template>

<script setup>
import { usePositionsStore } from '../stores/positions';
import { useLeafletMarkers } from '../composables/useLeafletMarkers';
import MapView from './MapView.vue';

const store = usePositionsStore();
const { markers, handleMapClick, handleMarkerDragEnd, handleMarkerClick, deleteSelected, clearAll } =
  useLeafletMarkers(store);

const center = [-12.046576, -77.045109];
const zoom = 13;
</script>
